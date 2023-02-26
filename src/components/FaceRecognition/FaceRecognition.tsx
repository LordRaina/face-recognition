import React from "react";
import "./FaceRecognition.scss";
import Camera from "../Camera/Camera";
import Form from "react-bootstrap/Form";
import LivenessCheck from "../LivenessCheck/LivenessCheck";
import { FaceRecognitionState } from "./type";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ObjectString } from "../../types/common";


export default class FaceRecognition extends React.Component<any, FaceRecognitionState> {
   
    state: FaceRecognitionState = {
        faceTracking: false,
        userFace: null,
        shouldTakePicture: false,
    }
    userFaceTimerId: NodeJS.Timeout | undefined = undefined;
    isTimerForEmpty: boolean = false;
    pictures: ObjectString = {};

    /**
     * Update the faceTracking state value
     * @param event 
     */
    handleFaceTrackingChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ faceTracking: event.target.checked })
    }

    /**
     * Update the state according to the face change. Since `setState` automatically re-render,
     * we'll only call it when the state is truly different.
     * 
     * We only want to set the face state when a change has been detected for a certain 
     * amount of time because the JeelizFaceFilter can sometimes stop detecting the face while 
     * the user moves his head 
     * use case:      Look straight -> move head to look left fast -> look left 
     * JeelizFace:      straight    ->  no face detected           -> left
     * our output:      straight    ->      straight                -> left
     * Or when the user is slowly reaching the threshold between two faces, the JeelizFaceFilter 
     * will return both faces every ms. We'll only change face when we're absolutely sure
     * use case:    Look straight ------> move head to look left (threshold) ----------> look left
     * JeelizFace:   straight   --------> straight->left->straight->left->... ---------> left
     * our output:   straight   -------->           straight                  ---------> left
     * 
     * @param face current user face
     */
    handleUserFaceChange(face: string | null): void {
        const differentFace = this.state.userFace !== face;
        if (differentFace) {
            const ms = face ? 200 : 1000;
            if (!this.userFaceTimerId) {
                this.userFaceTimerId = setTimeout(this.updateUserFace.bind(this), ms, face);
                this.isTimerForEmpty = !face;
            } else if (face && this.isTimerForEmpty) { // we prioritize face detection
                clearTimeout(this.userFaceTimerId);
                this.userFaceTimerId = setTimeout(this.updateUserFace.bind(this), ms, face);
                this.isTimerForEmpty = false;
            } 
        } else if (this.userFaceTimerId) {
            clearTimeout(this.userFaceTimerId);
            this.userFaceTimerId = undefined;
        }
    }

    /**
     * Update the user face on the state and reset the `userFaceTimerId`.
     * @param face face of the user
     */
    updateUserFace(face: string | null): void {
        this.setState({ userFace: face });
        this.userFaceTimerId = undefined;
    }
    /**
     * Update the state in order to change the props of the Camera component in order 
     * to take picture. See comments in `componentDidUpdate` method of the Camera component.
     */
    handleInstructionUpdate(): void {
        this.setState({ shouldTakePicture: true });
    }

    /**
     * Save the picture 
     * @param picture data url of the picture in base64.
     */
    handlePictureTaken(picture: string): void {
        if (this.state.userFace) {
            this.pictures[this.state.userFace] = picture.split(",")[1];
            this.setState({ shouldTakePicture: false });
        }
    }

    /**
     * Download all the pictures in a zip file.
     */
    handleDownloadPictures(): void {
        const zip = new JSZip();
        for (const [key, values] of Object.entries(this.pictures)) {
            zip.file(`${key}.png`, values, { base64: true });
        }
        zip.generateAsync({type:"blob"}).then(function(content: any) {
            saveAs(content, "pictures.zip");
        });
        
    }

    /**
     * The liveness check has been restarted, we reset the picutres.
     */
    handleRestart(): void {
        this.pictures = {};
    }

    render(): React.ReactNode {
        return (
            <main>
                <div className="face-recognition">
                    <div className="settings">
                    <Form.Switch 
                        label="Face tracking"
                        onChange={this.handleFaceTrackingChange.bind(this)}
                    />
                    </div>
                    <Camera faceTracking={this.state.faceTracking} onFaceChange={this.handleUserFaceChange.bind(this)} 
                            shouldTakePicture={this.state.shouldTakePicture} onPictureTaken={this.handlePictureTaken.bind(this)}
                    />
                    <LivenessCheck onInstructionUpdate={this.handleInstructionUpdate.bind(this)} 
                        userFace={this.state.userFace} onDownloadPicturesClick={this.handleDownloadPictures.bind(this)}
                        onRestart={this.handleRestart.bind(this)}
                    />
                </div>
            </main>
        )
    }
}
