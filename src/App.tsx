import "./App.css";
import { RenderingEngineComponent } from "./core/RenderingEngineComponent";
import VisualScript from "./page/visualScript/visualScript";



function App() {
  return (
    <div className="flex justify-center items-center h-screen">
      <VisualScript/>
    </div>
  );
}

export default App;
