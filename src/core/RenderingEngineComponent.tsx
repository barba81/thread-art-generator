import { useEffect, useRef } from "react";
import { RenderingEngine } from "./RenderingEngine";

export const RenderingEngineComponent = () => {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const renderingEngineRef = useRef<RenderingEngine>(null);

    useEffect(() => {
        if (canvasRef.current && !renderingEngineRef.current) {
            renderingEngineRef.current = new RenderingEngine(canvasRef.current);
        }
    }, []);

    return <canvas ref={canvasRef} />
}