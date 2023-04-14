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
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { AlertWarning } from "@/components/elements/alert";

// import Step2Modal from "./step2Modal";

interface IFormInputs {
    acceptTermAndConditions: boolean;
}

const schema = yup.object({
    acceptTermAndConditions: yup.boolean().required(labels.form.requiredField).default(false),
});

export default function Step2({ handleNext }: any) {
    const [open, setOpen] = useState(false);

    const [dataItem, setDataItem] = useState<any>({});

    // const handleClick = () => setOpen(!open)
    const handleClick = () => {
        window.location.assign(`/vu-biometric`);
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

    const onSubmit = (data: IFormInputs) => {
        if(!data.acceptTermAndConditions){
            return AlertWarning("Para continuar debe aceptar Términos y Políticas de Privacidad")
        }
        handleClick();
    };

    return (
        <>
            <br />
            <TextBody textCenter>
                Para verificarte tu identidad y seguir con el proceso de tu registro
                necesitas disponer de lo siguiente:
            </TextBody>
            <br />

            <form onSubmit={handleSubmit(onSubmit)}>
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
                        <Typography color="primary" sx={{ fontSize: "16px", fontWeight: "400", textAlign: "center" }}>
                            Verificación con pasaporte disponible próximamente
                        </Typography>
                    </GridItem>
                    <br />
                    <br />
                    <GridItem md={12} lg={12}>
                        <FormGroup sx={{ display: "flex", alignContent: "center" }}>
                            <FormControlLabel
                                onChange={(e: any) => {
                                    setValue("acceptTermAndConditions", e.target.checked)
                                }}
                                control={<Checkbox />}
                                label={
                                    <a target="_blank" rel="noreferrer" href=''>Aceptar Términos y Políticas de Privacidad <span className="text-error">*</span></a>
                                }
                            />
                        </FormGroup>
                    </GridItem>
                </GridContainer>

                <GridContainer marginY>
                    <GridItem md={12} lg={12}>
                        <ButtonApp submit>INICIAR PROCESO</ButtonApp>
                        {/* <Step2Modal
                        open={open}
                        handleClick={handleClick}
                        handleNextForm={handleNextForm}
                    /> */}
                    </GridItem>
                </GridContainer>
            </form>
        </>
    );
}
