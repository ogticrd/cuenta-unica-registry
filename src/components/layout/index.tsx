import Container from "@mui/material/Container";

import NavBar from "./navBar";
import Footer from "./footer";

export default function Index({ children }: any) {
  return (
    <>
      <NavBar />
      <Container sx={{ padding: "40px 10px" }}>{children}</Container>
      <Footer />
    </>
  );
}
