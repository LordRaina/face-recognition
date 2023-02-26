import React from "react";
import "./App.scss";
import Header from "../Header/Header";
import FaceRecognition from "../FaceRecognition/FaceRecognition";

export default class App extends React.Component {

    render() {
        return (
            <div className="App">
                <Header />
                <FaceRecognition />
            </div>
        );
    }
}
