import Container from '@mui/material/Container';

interface IProps {
    children: React.ReactNode
}

export const ContainerApp = ({ children }: IProps) => {
    return (
        <Container>
            {children}
        </Container>
    );
}
