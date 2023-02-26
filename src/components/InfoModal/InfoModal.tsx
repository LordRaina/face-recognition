import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { InfoModalState } from './type';
import "./InfoModal.scss";


export default class InfoModal extends React.Component<any, InfoModalState> {
    state: InfoModalState = {
        show: false,
    }

    constructor(props: any) {
        super(props);
        this.handleShow = this.handleShow.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    handleShow() {
        this.setState({
            show: true,
        })
    }

    handleClose() {
        this.setState({
            show: false,
        })
    }

    render() {
        return (
            <>
                <Button variant="primary" onClick={this.handleShow}>
                    Info
                </Button>

                <Modal show={this.state.show} onHide={this.handleClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Info</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Face recognition application that must guide the end user 
                        to proceed in a liveness check (moving its head to get different angles).
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={this.handleClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </>
        );        
    }
}
