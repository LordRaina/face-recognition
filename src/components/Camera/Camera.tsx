import React from "react";
import { JEELIZFACEFILTER, NN_DEFAULT } from 'facefilter'; 
import "./Camera.scss";
import { CameraProps, Coordinates, DetectedState } from "./type";
import { STRAIGHT, OPEN, RIGHT, LEFT, UP, DOWN } from "../../const/expression";


export default class Camera extends React.Component<CameraProps> {
    
    videoRef = React.createRef<HTMLCanvasElement>();
    faceRef = React.createRef<HTMLCanvasElement>();
    faceContext: CanvasRenderingContext2D | null = null;
    coordinates: Coordinates = { x: 0, y: 0, w: 0, h: 0 };
    intervalId: NodeJS.Timer | null = null;
    faceDetected: boolean = false;
    canvasSize: number = 400;
    xAngle = Math.PI / 9;
    yAngle = Math.PI / 6;

    /**
     * Initialize the JeelizFaceFilter library
     */
    componentDidMount(): void {
        JEELIZFACEFILTER.init({
            canvas: this.videoRef.current,
            NNC: NN_DEFAULT, 
            callbackReady: (errCode: string) => {
                if (errCode){
                    console.log('AN ERROR HAPPENS. ERROR CODE =', errCode);
                    return;
                }
                this.initScene()
                console.log('INFO: JEELIZFACEFILTER IS READY');
            }, 
            callbackTrack: this.callbackTrack.bind(this), 
        });
    }

    /**
     * Small hack allowing for sibiling component to communicate. Once the LivenessCheck component
     * validate the user face, a picture should be taken. A better solution would be to use Redux 
     * and create a store or use React hooks and transform everything into functionnal components 
     * instead of class components
     * @param prevProps previous props before the component update
     */
    componentDidUpdate(prevProps: CameraProps): void {
        if (this.props.shouldTakePicture && !prevProps.shouldTakePicture) {
            const pictureBase64 = this.videoRef.current?.toDataURL();
            this.props.onPictureTaken(pictureBase64);
        }
    }

    /**
     * Prepares and init some attributes
     * @param spec 
     */
    initScene(): void {
        JEELIZFACEFILTER.set_videoOrientation(0, true);
        const faceCanvas = this.faceRef.current;
        if (!faceCanvas) {
            throw new Error("Reference to face canvas doesn't exist")
        }
        this.faceContext = faceCanvas.getContext("2d");
        if (!this.faceContext) {
            throw new Error("Canvas 2D face context doesn't exist")
        }
        this.faceContext.strokeStyle = "yellow";
        // we don't necessarily want to redraw at every render iteration which happens 
        // a whole lot more than 10 times in a second
        this.intervalId = setInterval(this.drawFaceTracking.bind(this), 100) 
    }

    /**
     * Callback called at each render iteration
     * @param detectedState 
     */
    callbackTrack(detectState: DetectedState): void {
        this.setFaceTrackingCoordinates(detectState);
        this.faceDetected = detectState.detected > 0.7;
        this.onFaceChange(detectState);
        JEELIZFACEFILTER.render_video();
    }

    /**
     * Propagate the face change to the parent component. We only consider 6 faces:
     * looking straight, looking left, looking right, looking up, looking down and 
     * opening the mouth. 
     * The `detectedState` returned by the JeeLizFaceFilter callback provides the Euler angles
     * of the head rotation in radians. We only care about the rotation on the x and y axis.
     * Rotating the head on the x axis means looking up with an angle of at least -20 degrees (-pi/9 in radians)
     * and down with at least 20 degrees (pi/9 in radians)
     * Rotating the head on y axis means looking right with an angle of at least 30 degrees (pi/6 in radians)
     * and left with at least -30 degrees (-pi/6 in radians)
     * 
     * The rotation on the y axis will be prioritazed over the x axis (if the user look both left and down,
     * we'll only consider left)
     * 
     * @param detectedState Object given by the JeelizFaceFilter containing the
     * rotation angles `rx` and `ry` in radians as well as an array listing the facial 
     * expression coefficients
     */
    onFaceChange(detectedState: DetectedState): void {
        let currentFaceAction = null;
        if (this.faceDetected) {
            if (detectedState.expressions[0] > 0.8) {
                currentFaceAction = OPEN;
            } else if (this.yAngle < detectedState.ry && detectedState.ry > 0) {
                currentFaceAction = RIGHT;
            } else if (-this.yAngle > detectedState.ry && detectedState.ry < 0) {
                currentFaceAction = LEFT;
            } else if (this.xAngle < detectedState.rx && detectedState.rx > 0) {
                currentFaceAction = DOWN;
            } else if (-this.xAngle > detectedState.rx && detectedState.rx < 0) {
                currentFaceAction = UP;
            } else {
                currentFaceAction = STRAIGHT;
            }
        }
        this.props.onFaceChange(currentFaceAction);
    }

    /**
     * Compute the coordinates of the square for the face tracking.
     * @param detectedState Object given by the JeelizFaceFilter containing the 
     * 2D coordinates x and y of the center of the detection frame in the viewport (values -1 to 1)
     * and the scale s along the horizontal axis of the detection frame (which is a square)
     */
    setFaceTrackingCoordinates(detectedState: DetectedState): void {
        // The x value is between -1 and 1 which means that -1 = 0 and 1 = canvas width
        this.coordinates.x = Math.round((detectedState.x + 1 - detectedState.s) * 0.5 *this.canvasSize);
        // The y value is also between -1 and 1 where 1 = and -1 = canvas heigth
        this.coordinates.y = Math.round((-detectedState.y + 1 - detectedState.s) * 0.5 * (this.canvasSize));
        this.coordinates.w = Math.round(detectedState.s * this.canvasSize);
        // a face isn't usually a square, so we add a bit in order to create a rectf to be around at chin size
        this.coordinates.h = Math.round(detectedState.s * (this.canvasSize + 50)); 
    }
  
    /**
     * Draw the face tracking square on the "face canvas" based on the stored coordinates
     */
    drawFaceTracking(): void {
        if (this.faceContext) {
            this.faceContext.clearRect(0, 0, this.canvasSize, this.canvasSize);
            if (this.faceDetected && this.props.faceTracking) {
                const {x, y, w, h} = this.coordinates;
                this.faceContext.strokeRect(x, y, w, h);
            }
        }
    }

    render(): React.ReactNode {
        return (
            <div className="camera-container">
                <canvas className="face-canvas" width={this.canvasSize} height={this.canvasSize} ref={this.faceRef}/>
                <canvas className="video-canvas" width={this.canvasSize} height={this.canvasSize}  ref={this.videoRef}/>
            </div>
        )
    }
}
