import NavBar from './navBar'
import Footer from './footer'

export default function Index({ children }: any) {
    return (
        <>
            <NavBar />
            {children}
            <Footer />
        </>
    );
}
