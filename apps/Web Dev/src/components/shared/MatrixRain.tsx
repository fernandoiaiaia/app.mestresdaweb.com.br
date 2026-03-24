"use client";

import { useEffect, useState } from "react";

export default function MatrixRain() {
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            setColumns(Math.floor(window.innerWidth / 80));
        };

        updateColumns();

        window.addEventListener("resize", updateColumns);
        return () => window.removeEventListener("resize", updateColumns);
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none flex w-full border-r border-slate-900/5 opacity-80 overflow-hidden">
            {Array.from({ length: columns }).map((_, i) => {
                const isCenter = i === Math.floor(columns / 2);
                const hasBeam = Math.random() > 0.3;

                const delay = `${(Math.random() * 5).toFixed(2)}s`;
                const duration = `${(Math.random() * 4 + 4).toFixed(2)}s`;

                return (
                    <div key={i} className="flex-1 border-l border-slate-700/20 h-full flex justify-center relative overflow-hidden">
                        {isCenter ? (
                            <>
                                <div className="absolute top-0 -left-[1px] w-[2px] h-96 bg-gradient-to-b from-transparent via-blue-600/80 to-transparent animate-beam-2"></div>
                                <div className="h-full border-r border-dashed border-blue-600/30 w-[2px]"></div>
                                <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[300px] rounded-full bg-gradient-to-b from-transparent via-blue-500 to-transparent shadow-[0_0_20px_4px_rgba(59,130,246,0.4)] animate-beam-1"
                                    style={{
                                        animationDelay: '1.5s'
                                    }}
                                ></div>
                            </>
                        ) : hasBeam ? (
                            <div
                                className="absolute top-0 -left-[1px] w-[2px] h-64 bg-gradient-to-b from-transparent via-blue-600/60 to-transparent"
                                style={{
                                    animation: `beam-fall ${duration} infinite linear`,
                                    animationDelay: delay
                                }}
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
