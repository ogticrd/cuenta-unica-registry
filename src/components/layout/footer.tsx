import { IconButton, Typography } from "@mui/material";
import Divider from '@mui/material/Divider';

import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';

import logoGOB from "../../../public/assets/logoGOB.png"
import logoOGTIC from "../../../public/assets/logoOGTIC.png"

import { GridContainer, GridItem } from "../elements/grid";

import DivGrow from "../elements/divGrow";

export default function Index() {

    return (
        <>
            <div style={{ padding: "75px 25px" }} className="bg-primary">
                <GridContainer>
                    <GridItem md={12} lg={3}>
                        <div style={{ display: "flex" }}>
                            <img src={logoGOB.src} alt="logo" width="200" />
                            {/* <Divider orientation="vertical" sx={{background: "silver"}} variant="middle" flexItem /> */}
                        </div>
                    </GridItem>
                    <GridItem md={12} lg={9}>
                        <GridContainer>
                            <GridItem md={6} lg={3}>
                                <Typography variant="subtitle2" fontWeight="600" color="white">CONÓCENOS</Typography>
                                <br />
                                <Typography variant="body2" color="white">
                                    Oficina Gubernamental de Tecnologías de la Información y Comunicación
                                </Typography>
                            </GridItem>

                            <GridItem md={6} lg={3}>
                                <Typography variant="subtitle2" fontWeight="600" color="white">CONTÁCTANOS</Typography>
                                <br />
                                <Typography variant="body2" color="white">
                                    Tel: (809)-286-1009
                                </Typography>
                                <Typography variant="body2" color="white">
                                    Fax: (809)-732-5465
                                </Typography>
                                <Typography variant="body2" color="white">
                                    info@ogtic.gob.do
                                </Typography>
                            </GridItem>

                            <GridItem md={6} lg={3}>
                                <Typography variant="subtitle2" fontWeight="600" color="white">BÚSCANOS</Typography>
                                <br />
                                <Typography variant="body2" color="white">
                                    Av. 27 de Febrero #419 casi esquina Núñez de Cáceres, Santo Domingo, R.D.
                                </Typography>
                            </GridItem>

                            <GridItem md={6} lg={3}>
                                <Typography variant="subtitle2" fontWeight="600" color="white">INFÓRMATE</Typography>
                                <br />
                                <Typography variant="body2" color="white">
                                    Términos de Uso Política de Privacidad Preguntas Frecuentes
                                </Typography>
                            </GridItem>
                        </GridContainer>
                    </GridItem>
                </GridContainer>
            </div>

            <div style={{ background: "white", padding: "15px 25px" }}>
                <GridContainer>
                    <GridItem md={6} lg={6}>
                        <div style={{ marginTop: "8px" }}>
                            <Typography variant="caption" fontWeight="600" color="primary">
                                © {new Date().getFullYear()} Todos los Derechos Reservados. Desarrollado por
                            </Typography>
                            <img style={{ marginBottom: "-10px", marginLeft: "5px" }} src={logoOGTIC.src} alt="logo ogtic" width="50" />
                        </div>
                    </GridItem>

                    <GridItem md={6} lg={6}>
                        <DivGrow>
                            <div style={{ display: "flex" }}>
                                <Typography sx={{ margin: "auto", marginRight: "10px" }} variant="body2" fontWeight="bold" color="primary">
                                    SÍGUENOS
                                </Typography>

                                <IconButton
                                    color="primary"
                                // onClick={() => window.open("")}
                                >
                                    <FacebookIcon />
                                </IconButton>

                                <IconButton
                                    color="primary"
                                // onClick={() => window.open("")}
                                >
                                    <YouTubeIcon />
                                </IconButton>

                                <IconButton
                                    color="primary"
                                // onClick={() => window.open("")}
                                >
                                    <TwitterIcon />
                                </IconButton>

                                <IconButton
                                    color="primary"
                                // onClick={() => window.open("")}
                                >
                                    <InstagramIcon />
                                </IconButton>
                            </div>
                        </DivGrow>
                    </GridItem>
                </GridContainer>

            </div>
        </>
    )
}