"use client"

import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { handleCanvasMouseDown, handleResize, initializeFabric } from "@/lib/canvas";
import { fabric } from "fabric";
import React from "react";

export default function Page() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fabricRef = React.useRef<fabric.Canvas | null>(null);
  const isDrawing = React.useRef(false);
  const shapeRef = React.useRef<fabric.Object | null>(null);
  const selectedShapeRef = React.useRef<string | null>("rectangle");

  React.useEffect(() => {
    const canvas = initializeFabric({ canvasRef, fabricRef })

    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
      });
    })

    window.addEventListener("resize", () => {
      // handleResize({ fabricRef });
    });
  }, []);


  return (
    <div className="h-sceen overflow-hidden">
      <Navbar />

      <section className="flex h-full flex-row">
        <LeftSidebar />
        <Live canvasRef={canvasRef} />
        <RightSidebar />
      </section>
    </div>
  );
}