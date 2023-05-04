import SentimentSatisfiedAltOutlinedIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import MasksOutlinedIcon from "@mui/icons-material/MasksOutlined";
import { TransitionProps } from "@mui/material/transitions";
import { useState, useEffect, forwardRef } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import { io, Socket } from "socket.io-client";
import AppBar from "@mui/material/AppBar";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import { Box } from "@mui/material";
import Image from "next/image";
import axios from "axios";

import { GridContainer, GridItem } from "@/components/elements/grid";
import { ContainerApp } from "@/components/elements/container";
import { ButtonApp } from "@/components/elements/button";
import { Challenge } from "@/models/challenge-response";
import Logo from "../../../../public/assets/logo.png";

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function Step2Modal({
  open,
  handleClick,
  handleNextForm,
  identity,
}: any) {
  const [validLevel, setValidLevel] = useState<any>(null);
  const [isRecording, setIsRecording] = useState<boolean>();
  const [showingSignal, setShowingSignal] = useState<boolean>();
  const [singDescription, setSignDescription] = useState<any>();

  const recordingTime = 1000;

  const getChallenge = async (): Promise<any> => {
    const { data } = await axios.get<any>(
      "https://facial-auth-api-master-x6fzoay5ua-ue.a.run.app/" + "/challenge"
    );
    return { id: data.id, challenge: new Challenge(data.id, data.sign) };
  };

  const getFacialChallenge = async () => {
    const { id, challenge } = await getChallenge();
    setSignDescription(challenge.getSignDescription());
    return id;
  };

  let destroyStreaming: Function = () => {};

  let socket: Socket;
  const startSocket = () => {
    new Promise((resolve, reject) => {
      socket = io(`https://facial-auth-api-master-x6fzoay5ua-ue.a.run.app/`);

      socket.on("connect", () => {
        console.log("Connected => ", socket?.id);
        resolve(socket?.id);
      });

      socket.on("result", (data: any) => {
        if (data.error) {
          console.log(data.error);
        } else {
          const result: any = data;
          if (result.face_verified && result.is_alive && result.verified) {
            destroyStreaming();
            setValidLevel(0);
          }
        }
      });
    });
  };

  const listenVideoStreaming = async () => {
    const video: any = document.getElementById("videoElement");
    const id = await getFacialChallenge();

    setShowingSignal(true);
    await wait(5000);
    setShowingSignal(false);

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(async (stream) => {
          video.srcObject = stream;
          let isValid = false;

          destroyStreaming = () => stopRecording(stream);

          let tries = 0;
          while (!isValid && identity) {
            if (tries >= 19) {
              console.log("Reconecting...");

              socket.close();
              socket.disconnect();
              await startSocket();
              destroyStreaming();
              listenVideoStreaming();
              break;
            }

            tries++;

            setIsRecording(true);
            const base64 = await startRecording(stream, recordingTime);

            setIsRecording(false);
            socket.emit(
              "verify",
              {
                cedula: identity.cedula,
                source: base64 as string,
                id,
              },
              () => console.log("sent")
            );
          }

          stopRecording(stream);
        })
        .catch((error) => {
          console.log("Something went wrong!", error);
        });
    }
  };

  const wait = (delayInMS: number) =>
    new Promise((resolve) => setTimeout(resolve, delayInMS));

  const startRecording = (stream: any, lengthInMS: number): Promise<string> => {
    return new Promise((res, rej) => {
      const recorder = new MediaRecorder(stream);
      const data: any = [];

      recorder.ondataavailable = (event) => data.push(event.data);
      recorder.start();

      let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = (event: any) => reject(event.name);
      });

      let recorded = wait(lengthInMS).then(
        () => recorder.state === "recording" && recorder.stop()
      );

      return Promise.all([stopped, recorded]).then(async () => {
        const base64 = await blobToBase64(data[0]);
        res(base64 as string);
      });
    });
  };

  const blobToBase64 = (blob: any) => {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const stopRecording = (stream: any) =>
    stream?.getTracks()?.forEach((track: any) => track.stop());

  useEffect(() => {
    startSocket();

    listenVideoStreaming();

    setTimeout(() => !identity && alert("/registration"), 100);
    return () => {
      destroyStreaming();
      socket.disconnect();
    };
  }, [identity, listenVideoStreaming, startSocket]);

  return (
    <div>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClick}
        TransitionComponent={Transition}
      >
        <AppBar elevation={0} sx={{ position: "absolute" }}>
          <Toolbar>
            <Box sx={{ flex: 1 }}>
              <Image src={Logo.src} alt="logo" width="200" height="40" />
            </Box>
            <ButtonApp
              notFullWidth
              startIcon={<LogoutIcon />}
              variant="text"
              color="inherit"
              onClick={handleClick}
            >
              Salir
            </ButtonApp>
          </Toolbar>
        </AppBar>
        <div
          className="bg-primary"
          style={{ minHeight: "100vh", paddingTop: "80px" }}
        >
          <ContainerApp>
            <GridContainer
              spacing={5}
              flexDirection={{ xs: "column", sm: "row" }}
            >
              <GridItem sx={{ order: { xs: 2, sm: 1 } }} sm={12} md={4} lg={3}>
                {validLevel === 0 ? (
                  <>
                    <Typography
                      color="white"
                      fontSize="18px"
                      fontWeight="bold"
                      gutterBottom
                    >
                      ¡Gracias, {identity?.name?.split(" ")[0]}! <br /> Tu
                      identidad ha sido verificada.
                    </Typography>
                    <Typography
                      color="white"
                      fontWeight="400"
                      fontSize={14}
                      gutterBottom
                    >
                      Ahora puedes continuar a completar tu registro de cuenta
                      única ciudadana.
                    </Typography>
                    <br />
                    <ButtonApp color="inherit" onClick={() => handleNextForm()}>
                      <span
                        className="text-secondary"
                        style={{ fontWeight: "bold" }}
                      >
                        CONTINUAR
                      </span>
                    </ButtonApp>
                  </>
                ) : (
                  <>
                    <Typography
                      color="white"
                      fontSize="18px"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Para verificar realiza unas fotos de tu rostro, mantén la
                      mirada adelante con gesto neutral.
                    </Typography>

                    <div className="py-1">
                      <div
                        style={{
                          background: "#EFF7FF",
                          borderRadius: "4px",
                          padding: "10px 8px",
                          marginBottom: "12px",
                          display: "flex",
                          alignItems: "center",
                          flexDirection: "row",
                        }}
                      >
                        <MasksOutlinedIcon
                          sx={{ fontSize: "33px", marginRight: "12px" }}
                          color="info"
                        />
                        <Typography
                          variant="body2"
                          fontSize={14}
                          color="primary"
                          fontWeight="bold"
                        >
                          No usar lentes, gorra o cubrir el rostro
                        </Typography>
                      </div>

                      <div
                        style={{
                          background: "#EFF7FF",
                          borderRadius: "4px",
                          padding: "10px 8px",
                          marginBottom: "12px",
                          display: "flex",
                          alignItems: "center",
                          flexDirection: "row",
                        }}
                      >
                        <SentimentSatisfiedAltOutlinedIcon
                          sx={{ fontSize: "33px", marginRight: "12px" }}
                          color="info"
                        />
                        <Typography
                          variant="body2"
                          fontSize={14}
                          color="primary"
                          fontWeight="bold"
                        >
                          Acercar el rostro al círculo
                        </Typography>
                      </div>

                      <div
                        style={{
                          background: "#EFF7FF",
                          borderRadius: "4px",
                          padding: "10px 8px",
                          marginBottom: "12px",
                          display: "flex",
                          alignItems: "center",
                          flexDirection: "row",
                        }}
                      >
                        <LightModeOutlinedIcon
                          sx={{ fontSize: "33px", marginRight: "12px" }}
                          color="info"
                        />
                        <Typography
                          variant="body2"
                          fontSize={14}
                          color="primary"
                          fontWeight="bold"
                        >
                          Buscar buena iluminación sin reflejos
                        </Typography>
                      </div>
                    </div>
                  </>
                )}
              </GridItem>
              <GridItem sx={{ order: { xs: 1, sm: 2 } }} sm={12} md={8} lg={9}>
                {validLevel !== 0 && (
                  <div
                    style={{
                      background: "white",
                      border: "10px solid #2ECC71",
                      display: "flex",
                      justifyContent: "center",
                      borderRadius: "50%",
                      overflow: "hidden",
                      width: "450px",
                      height: "450px",
                    }}
                    className="life-test"
                  >
                    <div>
                      {showingSignal && singDescription?.image && (
                        <div
                          style={{
                            width: "100%",
                            height: "450px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Image
                            width="325"
                            height="216"
                            src={`/images/signs/${singDescription?.image}.png`}
                            alt={"Image " + singDescription?.image}
                          />
                        </div>
                      )}
                      <video
                        style={{
                          display: `${
                            showingSignal && !singDescription?.image && "none"
                          }`,
                          background: "white",
                        }}
                        id="videoElement"
                        autoPlay
                      ></video>
                    </div>
                  </div>
                )}
              </GridItem>
            </GridContainer>
          </ContainerApp>
        </div>
      </Dialog>
    </div>
  );
}
