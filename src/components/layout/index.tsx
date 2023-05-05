import Container from "@mui/material/Container";

import NavBar from "./navBar";
import Footer from "./footer";

export default function Index({ children }: any) {
  return (
    <>
      <NavBar />
      <Container sx={{ padding: "50px 0px" }}>{children}</Container>
      <Footer />
    </>
  );
}
