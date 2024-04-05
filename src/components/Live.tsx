import React from 'react'
import LiveCursors from './cursor/LiveCursors'
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from '../../liveblocks.config'
import CursorChat from './cursor/CursorChat';
import { CursorMode, CursorState, Reaction, ReactionEvent } from '@/types/type';
import ReactionSelector from './reaction/ReactionButton';
import FlyingReaction from './reaction/FlyingReaction';
import useInterval from '@/hooks/useInterval';

const Live = () => {
    const others = useOthers();
    const [{ cursor }, updateMyPresence] = useMyPresence() as any;

    const [cursorState, setCursorState] = React.useState<CursorState>({
        mode: CursorMode.Hidden,
    })

    const [reactions, setReactions] = React.useState<Array<Reaction>>([]);

    const broadcast = useBroadcastEvent();

    useInterval(() => {
        setReactions(reactions => reactions.filter(
            (reaction) => reaction.timestamp > Date.now() - 4000)
        );
    }, 1000);

    useInterval(() => {
        if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
            setReactions((reactions) => reactions.concat([{
                point: { x: cursor.x, y: cursor.y },
                value: cursorState.reaction,
                timestamp: Date.now(),
            }]));

            broadcast({
                x: cursor.x,
                y: cursor.y,
                value: cursorState.reaction
            })
        }
    }, 20);

    useEventListener((eventData) => {
        const event = eventData.event as ReactionEvent;

        setReactions((reactions) => reactions.concat([{
            point: { x: event.x, y: event.y },
            value: event.value,
            timestamp: Date.now(),
        }]));
    })

    const handlePointerMove = React.useCallback((event: React.PointerEvent) => {
        event.preventDefault();

        if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
            const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

            updateMyPresence({ cursor: { x, y } });
        }
    }, [])

    const handlePointerLeave = React.useCallback((event: React.PointerEvent) => {
        setCursorState({ mode: CursorMode.Hidden })

        updateMyPresence({ cursor: null, message: null });
    }, [])

    const handlePointerDown = React.useCallback((event: React.PointerEvent) => {
        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

        updateMyPresence({ cursor: { x, y } });

        setCursorState((state: CursorState) => cursorState.mode === CursorMode.Reaction
            ? { ...state, isPressed: true } : state);

    }, [cursorState.mode, setCursorState]);

    const handlePointerUp = React.useCallback(() => {
        setCursorState((state: CursorState) => cursorState.mode === CursorMode.Reaction
            ? { ...state, isPressed: false } : state
        )
    }, [cursorState.mode, setCursorState])

    React.useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === "/") {
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: ""
                })
            } else if (e.key === "Escape") {
                updateMyPresence({ message: "" })
                setCursorState({ mode: CursorMode.Hidden })
            } else if (e.key == "e") {
                setCursorState({
                    mode: CursorMode.ReactionSelector
                })
            }
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/") {
                e.preventDefault();
            }
        }

        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("keydown", onKeyDown);
        }
    }, [updateMyPresence])

    const setReaction = React.useCallback((reaction: string) => {
        setCursorState({
            mode: CursorMode.Reaction,
            reaction,
            isPressed: false
        })
    }, [])

    return (
        <div
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="h-[100vh] w-[100vw] flex justify-center items-center text-center"
        >
            <h1 className="text-5xl text-gray-500">Liveblocks Figma Clone {cursorState.mode}</h1>

            {reactions.map((reaction) => (
                <FlyingReaction
                    key={reaction.timestamp.toString()}
                    x={reaction.point.x}
                    y={reaction.point.y}
                    timestamp={reaction.timestamp}
                    value={reaction.value}
                />
            ))}

            {cursor && (
                <CursorChat
                    cursor={cursor}
                    cursorState={cursorState}
                    setCursorState={setCursorState}
                    updateMyPresence={updateMyPresence}
                />
            )}

            {cursorState.mode === CursorMode.ReactionSelector && (
                <ReactionSelector
                    setReaction={setReaction}
                />
            )}

            <LiveCursors others={others} />
        </div>
    )
}

export default Live