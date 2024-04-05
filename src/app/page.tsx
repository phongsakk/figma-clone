"use client"

import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvasObjectMoving, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import { ActiveElement } from "@/types/type";
import { fabric } from "fabric";
import React from "react";
import { useMutation, useStorage } from "../../liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete } from "@/lib/key-events";

export default function Page() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fabricRef = React.useRef<fabric.Canvas | null>(null);
  const isDrawing = React.useRef(false);
  const shapeRef = React.useRef<fabric.Object | null>(null);
  const selectedShapeRef = React.useRef<string | null>("rectangle");
  const activeObjectRef = React.useRef<fabric.Object | null>(null);

  const canvasObjects = useStorage((root) => root.canvasObjects);

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;

    const { objectId } = object;

    const shapeData = object.toJSON();
    shapeData.objecId = objectId;

    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.set(objectId, shapeData);
  }, []);

  const [activeElement, setActiveElement] = React.useState<ActiveElement>({
    name: "",
    value: "",
    icon: ""
  });

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects");

    if (!canvasObjects || canvasObjects.size === 0) {
      return true;
    }

    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({storage}, objecId) => {
    const canvasObjects = storage.get("canvasObjects");

    canvasObjects.delete(objecId);
  }, []);

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      case 'reset':
        deleteAllShapes();
        fabricRef.current?.clear;
        setActiveElement(defaultNavElement);
        break;

      case 'delete':
        handleDelete(fabricRef.current as any,deleteShapeFromStorage);
        setActiveElement(defaultNavElement);
        break;

      default:
        break;
    }

    selectedShapeRef.current = elem?.value as string;
  }

  React.useEffect(() => {
    const canvas = initializeFabric({ canvasRef, fabricRef })

    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef
      });
    })

    canvas.on("mouse:move", (options) => {
      handleCanvasMouseMove({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
        syncShapeInStorage
      });
    })

    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
        activeObjectRef,
        syncShapeInStorage,
        setActiveElement
      });
    })

    canvas.on("object:modified", (options) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      })
    });

    canvas.on("object:moving", (options) => {
      handleCanvasObjectMoving({
        options
      })
    });

    window.addEventListener("resize", () => {
      handleResize({ canvas: fabricRef.current });
    });

    return () => {
      canvas.dispose();
    }
  }, []);

  React.useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef
    });
  }, [canvasObjects]);

  return (
    <div className="h-sceen overflow-hidden">
      <Navbar
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
      />

      <section className="flex h-full flex-row">
        <LeftSidebar />
        <Live canvasRef={canvasRef} />
        <RightSidebar />
      </section>
    </div>
  );
}