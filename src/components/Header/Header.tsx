import React from "react";
import "./Header.scss";
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import InfoModal from "../InfoModal/InfoModal";


export default class Header extends React.Component {
    render() {
        return (
            <header>
                <Navbar expand="lg">
                   <Container>
                        <Navbar.Brand>Face Recognition</Navbar.Brand>
                        <InfoModal />
                    </Container>
                </Navbar>
            </header>
        );
    }
}
