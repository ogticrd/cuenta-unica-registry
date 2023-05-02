import { useState, useRef, useEffect, forwardRef } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import MasksOutlinedIcon from '@mui/icons-material/MasksOutlined';
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { io, Socket } from 'socket.io-client';

import Logo from "../../../../public/assets/logo.png"
import { Box } from '@mui/material';
import { ButtonApp } from '@/components/elements/button';
import { ContainerApp } from '@/components/elements/container';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { Challenge } from '@/models/challenge-response';
import axios from 'axios';

const Transition = forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function Step2Modal({ open, handleClick, handleNextForm, identity }: any) {

    console.log(identity)

    const [validLevel, setValidLevel] = useState<any>(null);
    const [isRecording, setIsRecording] = useState<boolean>();
    const [showingSignal, setShowingSignal] = useState<boolean>();
    const [singDescription, setSignDescription] = useState<any>();

    // const videoRef = useRef<HTMLVideoElement>(null);
    // console.log(videoRef)

    // React.useEffect(() => {
    //   if (videoRef.current) {
    // navigator.mediaDevices
    //     .getUserMedia({ video: true })
    //     .then((stream) => {
    //         const video = videoRef.current!;
    //         video.srcObject = stream;
    //         video.onloadedmetadata = () => {
    //             video.play();
    //         };
    //     })
    //     .catch((error) => {
    //         console.error('Error al acceder a la cámara:', error);
    //     });
    //   }
    // }, []);

    const recordingTime = 1000;

    const getChallenge = async (): Promise<any> => {
        const { data } = await axios.get<any>("https://facial-auth-api-master-x6fzoay5ua-ue.a.run.app/" + '/challenge');
        return { id: data.id, challenge: new Challenge(data.id, data.sign) };
    };

    const getFacialChallenge = async () => {
        const { id, challenge } = await getChallenge();
        setSignDescription(challenge.getSignDescription());
        return id;
    };

    let destroyStreaming: Function = () => { };

    let socket: Socket;
    const startSocket = () => {

        new Promise((resolve, reject) => {
            socket = io(
                `https://facial-auth-api-master-x6fzoay5ua-ue.a.run.app/`
            );

            socket.on('connect', () => {
                console.log('Connected => ', socket?.id);
                resolve(socket?.id)
            });

            socket.on('result', (data: any) => {
                console.log(data);

                if (data.error) {
                    console.log(data.error);
                } else {
                    const result: any = data
                    if (result.face_verified && result.is_alive && result.verified) {
                        destroyStreaming()
                        setValidLevel(0)
                    }
                }
            });
        })
    };

    const listenVideoStreaming = async () => {
        const video: any = document.getElementById('videoElement');
        const id = await getFacialChallenge()

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

                            socket.close()
                            socket.disconnect()
                            await startSocket()
                            destroyStreaming()
                            listenVideoStreaming()
                            break
                        }

                        tries++;

                        setIsRecording(true);
                        const base64 = await startRecording(stream, recordingTime);
                        // console.log(base64);

                        setIsRecording(false);
                        socket.emit(
                            'verify',
                            {
                                cedula: identity.cedula,
                                source: base64 as string,
                                id,
                            },
                            () => console.log('sent')
                        );
                    }

                    stopRecording(stream);
                })
                .catch((error) => {
                    console.log('Something went wrong!', error);
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

            console.log(recorder.state + ' for ' + lengthInMS / 1000 + ' seconds...');

            let stopped = new Promise((resolve, reject) => {
                recorder.onstop = resolve;
                recorder.onerror = (event: any) => reject(event.name);
            });

            let recorded = wait(lengthInMS).then(
                () => recorder.state === 'recording' && recorder.stop()
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

    const stopRecording = (stream: any) => stream?.getTracks()?.forEach((track: any) => track.stop());


    useEffect(() => {

        startSocket();

        listenVideoStreaming();

        setTimeout(() =>
            !identity && alert('/registration'), 100);
        return () => {
            destroyStreaming();
            socket.disconnect();
        };
    }, [identity]);

    return (
        <div>
            <Dialog
                fullScreen
                open={open}
                onClose={handleClick}
                TransitionComponent={Transition}
            >
                <AppBar elevation={0} sx={{ position: 'absolute' }}>
                    <Toolbar>
                        <Box sx={{ flex: 1 }}>
                            <img src={Logo.src} alt="logo" width="200" />
                        </Box>
                        <ButtonApp
                            notFullWidth
                            startIcon={<LogoutIcon />}
                            variant='text'
                            color='inherit'
                            onClick={handleClick}
                        >
                            Salir
                        </ButtonApp>
                    </Toolbar>
                </AppBar>
                <div className="bg-primary" style={{ minHeight: "100vh", paddingTop: "80px" }}>
                    <ContainerApp>
                        <GridContainer
                            spacing={5}
                            flexDirection={{ xs: "column", sm: "row" }}
                        >
                            <GridItem sx={{ order: { xs: 2, sm: 1 } }} sm={12} md={4} lg={3}>
                                {validLevel === 0
                                    ?
                                    <>
                                        <Typography color="white" fontSize="18px" fontWeight="bold" gutterBottom>
                                            ¡Gracias, {identity?.name?.split(" ")[0]}! <br /> Tu identidad ha sido verificada.
                                        </Typography>
                                        <Typography color="white" fontWeight="400" fontSize={14} gutterBottom>
                                            Ahora puedes continuar a completar tu registro de cuenta única ciudadana.
                                        </Typography>
                                        <br />
                                        <ButtonApp
                                            color="inherit"
                                            onClick={() => handleNextForm()}
                                        >
                                            <span className="text-secondary" style={{ fontWeight: "bold" }}>CONTINUAR</span>
                                        </ButtonApp>
                                    </>
                                    :
                                    <>
                                        <Typography color="white" fontSize="18px" fontWeight="bold" gutterBottom>
                                            Para verificar realiza unas fotos de tu rostro, mantén la mirada adelante con gesto neutral.
                                        </Typography>
                                        {/* <Typography color="white" fontWeight="400" fontSize={14} gutterBottom>
                                    Hasta que el círculo se ponga verde.
                                </Typography> */}

                                        <div className="py-1">
                                            <div style={{ background: "#EFF7FF", borderRadius: "4px", padding: "10px 8px", marginBottom: "12px", display: "flex", alignItems: "center", flexDirection: "row" }}>
                                                <MasksOutlinedIcon sx={{ fontSize: "33px", marginRight: "12px" }} color="info" />
                                                <Typography variant="body2" fontSize={14} color="primary" fontWeight="bold">No usar lentes, gorra o cubrir el rostro</Typography>
                                            </div>

                                            <div style={{ background: "#EFF7FF", borderRadius: "4px", padding: "10px 8px", marginBottom: "12px", display: "flex", alignItems: "center", flexDirection: "row" }}>
                                                <SentimentSatisfiedAltOutlinedIcon sx={{ fontSize: "33px", marginRight: "12px" }} color="info" />
                                                <Typography variant="body2" fontSize={14} color="primary" fontWeight="bold">Acercar el rostro al círculo</Typography>
                                            </div>

                                            <div style={{ background: "#EFF7FF", borderRadius: "4px", padding: "10px 8px", marginBottom: "12px", display: "flex", alignItems: "center", flexDirection: "row" }}>
                                                <LightModeOutlinedIcon sx={{ fontSize: "33px", marginRight: "12px" }} color="info" />
                                                <Typography variant="body2" fontSize={14} color="primary" fontWeight="bold">Buscar buena iluminación sin reflejos</Typography>
                                            </div>
                                        </div>
                                    </>
                                }
                            </GridItem>
                            <GridItem sx={{ order: { xs: 1, sm: 2 } }} sm={12} md={8} lg={9}>
                                {/* <video ref={videoRef} style={{ height: "auto", width: "auto" }} autoPlay /> */}

                                {/* {isRecording && (
                                    <p className="bg-green-400 text-white font-semibold p-2 w-2/3 mx-auto text-center rounded-lg mb-2">
                                        Validando rasgos...
                                    </p>
                                )} */}
                                {validLevel !== 0 && (
                                    <div style={{ background: "white", border: "10px solid #2ECC71", display: "flex", justifyContent: "center", borderRadius: "50%", overflow: "hidden", width: "450px", height: "450px" }} className="life-test">
                                        <div>
                                            {showingSignal && singDescription?.image && (
                                                <div
                                                    style={{ width: "100%", height: "450px", display: "flex", justifyContent: "center", alignItems: "center" }}
                                                >
                                                    <img
                                                        width="325"
                                                        height="216"
                                                        src={`/images/signs/${singDescription?.image}.png`}
                                                        alt={'Image ' + singDescription?.image}
                                                    />
                                                </div>
                                            )}
                                            <video
                                                style={{ display: `${showingSignal && !singDescription?.image && "none"}`, background: "white" }}
                                                id="videoElement"
                                                autoPlay
                                            ></video>

                                            {/* {showingSignal && singDescription?.text && (
                                                <p className="text-center mt-6 text-gray-500 font-medium animate-pulse">
                                                {singDescription?.text}
                                                    </p>
                                                )} */}
                                        </div>
                                    </div>
                                )}
                                {/* {validLevel === 0 && <SuccessLifeValidation />} */}
                                {/* {(validLevel === 1) && (
                                        <div className="absolute flex items-center justify-center h-full w-full left-0 top-28">
                                            <div className=" bg-white border-2 border-blue-200 p-28 -mt-20 rounded-lg shadow-lg">

                                                <div className="flex flex-col items-center gap-2 text-red-600">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-14 w-14"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                    <p className="text-center font-medium text-lg">
                                                        Sus rasgos no han sido validados correctamente. <br />
                                                        Por favor, siga intentando.
                                                    </p>
                                                </div>
                                                )
                                            </div>
                                        </div>
                                    )} */}
                            </GridItem>
                        </GridContainer>
                    </ContainerApp>
                </div>
            </Dialog>
        </div>
    );
}