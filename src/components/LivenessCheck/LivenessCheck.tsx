import React from "react";
import "./LivenessCheck.scss";
import { Button } from "react-bootstrap";
import { STRAIGHT, OPEN, RIGHT, LEFT, UP, DOWN } from "../../const/expression";
import straight from "../../images/straight.png";
import open from "../../images/open.png";
import right from "../../images/right.png";
import left from "../../images/left.png";
import up from "../../images/up.png";
import down from "../../images/down.png";
import { ObjectString } from "../../types/common";
import { LivenessCheckProps, LivenessCheckState } from "./type";


export default class LivenessCheck extends React.Component<LivenessCheckProps, LivenessCheckState> {
    state: LivenessCheckState = {
        livenessState: "notStarted", // ["notStarted", "onGoing", "finished"]
        currentInstructionIndex: 0,
    }
    expressionImgMapping: ObjectString = {
        [STRAIGHT]: straight,
        [OPEN]: open,
        [RIGHT]: right,
        [LEFT]: left,
        [UP]: up,
        [DOWN]: down,
    }
    instructionDetailsMapping: ObjectString = {
        [STRAIGHT]: "Face the camera",
        [OPEN]: "Open your mouth",
        [RIGHT]: "Look right",
        [LEFT]: "Look left",
        [UP]: "Look up",
        [DOWN]: "Look down",
    }
    instructionImgRef = React.createRef<HTMLImageElement>();
    instructionTextRef = React.createRef<HTMLDivElement>();
    instructions: Array<string> = [RIGHT, LEFT, UP, DOWN, STRAIGHT, OPEN];
    correctInstructionTimerId: NodeJS.Timeout | undefined = undefined;

    isNotStarted() {
        return this.state.livenessState === "notStarted";
    }

    isOnGoing() {
        return this.state.livenessState === "onGoing";
    }

    isFinished() {
        return this.state.livenessState === "finished";
    }

    getInstructionImage(): string {
        const instruction = this.instructions[this.state.currentInstructionIndex];
        return this.expressionImgMapping[instruction];

    }

    getInstructionDetail(): string {
        const instruction = this.instructions[this.state.currentInstructionIndex];
        return this.instructionDetailsMapping[instruction];
    }

    /**
     * Once the component has been updated, we check the user face if the liveness check is 
     * ongoing and we set the entrance animation of the instructions if the next step has been 
     * reached.
     * @param prevProps previous props before the update, not used
     * @param prevState previous state before the update
     */
    componentDidUpdate(prevProps: LivenessCheckProps, prevState: LivenessCheckState): void {
        if (this.isOnGoing()) {
            this.checkUserFace();
        }
        if (this.state.currentInstructionIndex !== prevState.currentInstructionIndex) {
            this.setEntranceAnimation()
        }
    }

    /**
     * Verify if the user current face is corresponding to the current instruction. 
     * We only want to validate the face after a certain amount of time to be sure that the face 
     * was not done by mistake by the user.
     */
    checkUserFace(): void {
        if (this.props.userFace === this.instructions[this.state.currentInstructionIndex] && 
            !this.correctInstructionTimerId) {
            this.correctInstructionTimerId = setTimeout(this.updateInstruction.bind(this), 500);
        } else if (this.props.userFace !== this.instructions[this.state.currentInstructionIndex] && 
            this.correctInstructionTimerId) {
            clearTimeout(this.correctInstructionTimerId);
            this.correctInstructionTimerId = undefined;
        }
    }

    /**
     * Reset the CSS classes to launch the entrance animation of the next instruction.
     */
    setEntranceAnimation(): void {
        this.instructionImgRef.current?.classList.remove("correct");
        this.instructionImgRef.current?.classList.add("roll-in-right");
        this.instructionTextRef.current?.classList.remove("slide-to-left");
        this.instructionTextRef.current?.classList.add("slide-from-right");
    }

    /**
     * Launch the exit animation of the current instruction and update the 
     * state once the animations are finished.
     */
    updateInstruction(): void {
        // animations
        this.instructionImgRef.current?.classList.remove("roll-in-right");
        this.instructionImgRef.current?.classList.add("correct");
        this.instructionTextRef.current?.classList.remove("slide-from-right");
        this.instructionTextRef.current?.classList.add("slide-to-left");
        
        this.props.onInstructionUpdate();
        // we wait for the animation to finish before updating the state
        setTimeout(this.updateInstructionState.bind(this), 1600);
    }

    /**
     * Update the state to go to the next intruction or terminate the liveness check.
     */
    updateInstructionState(): void {
        if (this.state.currentInstructionIndex < this.instructions.length - 1) {
            this.setState({ currentInstructionIndex: this.state.currentInstructionIndex + 1 })
        } else {
            this.setState({ 
                currentInstructionIndex: 0,
                livenessState: "finished",
            })
        }
        this.correctInstructionTimerId = undefined;
    }
    
    handleStartClick(): void {
        this.setState({ livenessState: "onGoing" });
    }

    handleRestartClick(): void {
        this.setState({ livenessState: "onGoing" });
        this.props.onRestart()
    }

    handleDownloadPicturesClick(): void {
        this.props.onDownloadPicturesClick();
    }

    render() {
        return (
            <div className="liveness-check-container">
                <h2>Liveness check</h2>
                {this.isNotStarted() &&
                    <div className="button-container">
                        <Button onClick={this.handleStartClick.bind(this)}>Start</Button>
                    </div>
                }
                {this.isOnGoing() &&
                <>
                    <div className="instructions-container">
                        <img className="roll-in-right" ref={this.instructionImgRef} 
                            src={this.getInstructionImage()} alt="instruction" 
                        />
                        <div className="slide-from-right" ref={this.instructionTextRef}>
                            {this.getInstructionDetail()}
                        </div>
                    </div>
                    <div className="user-action">
                        <div>What we are detecting:</div>
                        {this.props.userFace &&
                            <img src={this.expressionImgMapping[this.props.userFace]} alt="user-face"/>
                        }
                        {!this.props.userFace &&
                            "No face detected !"
                        }
                    </div>
                </>
                }
                {this.isFinished() &&
                <>
                    <div className="button-container">
                        <Button onClick={this.handleRestartClick.bind(this)}>Restart</Button>
                        <Button onClick={this.handleDownloadPicturesClick.bind(this)}>Download pictures</Button>
                    </div>
                </>
                }
            </div>
        )
    }
}
