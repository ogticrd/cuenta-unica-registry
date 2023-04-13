import { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import SentimentSatisfiedOutlinedIcon from "@mui/icons-material/SentimentSatisfiedOutlined";

import { GridContainer, GridItem } from "@/components/elements/grid";
import { TextBody } from "@/components/elements/typography";
import { FormControlApp } from "@/components/form/input";
import { InputApp } from "@/themes/form/input";
import { labels } from "@/constants/labels";
import { ButtonApp } from "@/components/elements/button";
import { Typography } from "@mui/material";
// import Step2Modal from "./step2Modal";

interface IFormInputs {
    cedula: string;
}

const schema = yup.object({
    cedula: yup.string().trim().required(labels.form.requiredField),
});

export default function Step2({ handleNext }: any) {
    const [open, setOpen] = useState(false);

    const [dataItem, setDataItem] = useState<any>({});

    // const handleClick = () => setOpen(!open)
    const handleClick = () => {
        const infoCedula = JSON.parse(sessionStorage.getItem("infoCedula") || "")
        window.location.assign(`/asd?cedula=${infoCedula?.payload?.id}`);
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        setValue,
    } = useForm<IFormInputs>({
        reValidateMode: "onSubmit",
        shouldFocusError: false,
        resolver: yupResolver(schema),
    });

    const handleNextForm = () => {
        handleNext();
    };

    return (
        <>
            <br />
            <TextBody textCenter>
                Para verificarte tu identidad y seguir con el proceso de tu registro
                necesitas disponer de lo siguiente:
            </TextBody>
            <br />

            <GridContainer marginY>
                <GridItem md={12} lg={12}>
                    <div
                        style={{
                            background: "#EFF7FF",
                            borderRadius: "6px",
                            padding: "30px 20px",
                            display: "flex",
                            alignItems: "center",
                            flexDirection: "row",
                        }}
                    >
                        <CameraAltOutlinedIcon
                            sx={{ fontSize: "45px", marginRight: "12px" }}
                            color="info"
                        />
                        <Typography variant="body2" color="primary">
                            Tener disponible un teléfono móvil o computadora con{" "}
                            <span style={{ fontWeight: "bold" }}>cámara</span> integrada.
                        </Typography>
                    </div>
                </GridItem>

                {/* <GridItem md={12} lg={12}>
                    <div style={{ background: "#EFF7FF", borderRadius: "6px", padding: "30px 20px", display: "flex", alignItems: "center", flexDirection: "row" }}>
                        <BadgeOutlinedIcon sx={{ fontSize: "45px", marginRight: "12px" }} color="info" />
                        <Typography variant="body2" color="primary">Disponible tu <span style={{ fontWeight: "bold" }}>documento de identidad “cédula”.</span></Typography>
                    </div>
                </GridItem> */}

                <GridItem md={12} lg={12}>
                    <div
                        style={{
                            background: "#EFF7FF",
                            borderRadius: "6px",
                            padding: "30px 20px",
                            display: "flex",
                            alignItems: "center",
                            flexDirection: "row",
                        }}
                    >
                        <SentimentSatisfiedOutlinedIcon
                            sx={{ fontSize: "45px", marginRight: "12px" }}
                            color="info"
                        />
                        <Typography variant="body2" color="primary">
                            Permitir capturas de{" "}
                            <span style={{ fontWeight: "bold" }}>
                                fotografías de tu rostro.
                            </span>
                        </Typography>
                    </div>
                </GridItem>

                <GridItem md={12} lg={12}>
                    <TextBody textCenter>
                        Verificación con pasaporte disponible próximamente
                    </TextBody>
                </GridItem>
            </GridContainer>

            <GridContainer marginY>
                <GridItem md={12} lg={12}>
                    <ButtonApp onClick={handleClick}>INICIAR PROCESO</ButtonApp>
                    {/* <Step2Modal
                        open={open}
                        handleClick={handleClick}
                        handleNextForm={handleNextForm}
                    /> */}
                </GridItem>
            </GridContainer>
        </>
    );
}
