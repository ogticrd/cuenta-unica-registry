import NavBar from './navBar'
import Footer from './footer'

import Container from '@mui/material/Container';

export default function Index({ children }: any) {
    return (
        <>
            <NavBar />
            <Container sx={{padding: "40px 10px"}}>
                {children}
            </Container>
            <Footer />
        </>
    );
}
