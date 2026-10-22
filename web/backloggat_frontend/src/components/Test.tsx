import React from 'react'
import Circles from './Circles';

const Test = () => {

    console.log("hey");

    return (
        <>
            <div className="page-bg">
                <Circles />
            </div>

            <main className="relative z-10 mx-auto flex w-full max-w-[1080px] flex-col gap-6 py-10">

                <div className="rise flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-white/10 pb-3 font-mono text-[11px] tracking-[0.14em] text-dim" >
                    <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-accent"></span>PRJ-014 // PROYECTOS</span>
                    <span className="num flex items-center gap-5"><span>DÍA 05 / 46</span><span>HORA <span id="clock">21:58:03</span></span></span>
                </div>

                <header className="flex flex-wrap items-end justify-between gap-8">
                    <div className="rise flex min-w-0 flex-1 basis-[420px] flex-col gap-4" >
                        <div className="flex items-center gap-2.5 font-mono text-xs tracking-[0.12em] text-dim">
                            <span className="pulse h-2 w-2 rounded-full bg-accent"></span>
                            <span>EN CURSO · CREADO 10 OCT</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">Design System V2</h1>
                            <div className="neon-line"></div>
                        </div>
                        <p className="max-w-[560px] text-base leading-relaxed text-dim">Unificar componentes y eliminar CSS duplicado en todas las vistas Go con Tailwind.</p>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-dim">
                            <span className="num font-mono">15 oct → 30 nov</span>
                            <span className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-g700 font-mono text-[10px] text-ink" aria-hidden="true">UI</span>
                                Lead UI Architect
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <button type="button" className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-base">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 2v10M2 7h10" /></svg>
                                Nueva tarea
                            </button>
                            <button type="button" className="rounded-lg border border-g700 bg-white/[0.03] px-4 py-2 text-sm text-ink">Editar proyecto</button>
                        </div>
                    </div>

                    <section aria-label="Avance" className="rise glass glass-hi corners flex w-full flex-col items-center gap-2 px-6 pb-5 pt-6 sm:w-[300px]" >
                        <svg id="gauge" viewBox="0 0 160 160" className="h-[172px] w-[172px]" role="img" aria-label="Avance 82 por ciento, 18 de 22 tareas">
                            <circle cx="80" cy="80" r="77" fill="none" stroke="rgba(150,190,168,0.28)" stroke-width="1" />
                            <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(150,190,168,0.4)" stroke-width="4" pathLength="360" stroke-dasharray="0.5 4.5" />
                            <circle className="spin-c" cx="80" cy="80" r="47" fill="none" stroke="rgba(150,190,168,0.35)" stroke-width="1" stroke-dasharray="2 5" />
                            <g id="segs"></g>
                            <text x="80" y="82" text-anchor="middle" className="font-mono" fill="#F2F2F2" font-size="30" font-weight="500"><tspan id="gNum">82</tspan><tspan font-size="13" dy="-9" fill="#8FD3AE">%</tspan></text>
                            <text x="80" y="98" text-anchor="middle" className="font-mono" fill="#A7B5AD" font-size="7.5" letter-spacing="1.6">AVANCE</text>
                        </svg>
                        <div className="flex w-full items-center justify-between gap-3">
                            <span className="num font-mono text-xs text-dim">18 de 22 tareas</span>
                            <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent"></span>En buen ritmo
                            </span>
                        </div>
                    </section>
                </header>

                <div className="rise border-b border-g700" >
                    <nav className="relative flex flex-wrap items-stretch gap-7" aria-label="Secciones del proyecto" id="tabs">
                        <span className="tab-ind" id="tabInd" aria-hidden="true"></span>
                        <button type="button" className="tab py-3 text-[15px] font-medium text-accent" aria-current="page">Resumen</button>
                        <button type="button" className="tab py-3 text-[15px] text-dim">Cronograma</button>
                        <button type="button" className="tab py-3 text-[15px] text-dim">Tareas <span id="tabCount" className="num ml-1.5 rounded-full bg-g900 px-2 py-0.5 font-mono text-xs text-ink">4</span></button>
                        <button type="button" className="tab py-3 text-[15px] text-dim">Notas</button>
                    </nav>
                </div>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Resumen en cifras">
                    <div className="rise glass flex flex-col gap-2 p-5" >
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Tareas abiertas</span>
                        <span className="num font-mono text-[40px] font-medium leading-none"><span id="openCount">4</span><span className="ml-1.5 text-lg text-dim">/ 22</span></span>
                        <span id="highCount" className="text-[13px] text-dim">2 de prioridad alta</span>
                    </div>
                    <div className="rise glass glass-hi corners flex flex-col gap-2 p-5" >
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Días restantes</span>
                        <span className="num font-mono text-[40px] font-medium leading-none"><span id="daysNum" className="neon-text">42</span><span className="ml-1.5 text-lg text-dim">/ 46</span></span>
                        <span className="text-[13px] text-dim">Entrega 30 nov</span>
                    </div>
                    <div className="rise glass flex flex-col gap-2 p-5" >
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Próximo hito</span>
                        <span className="pt-1.5 text-[22px] font-semibold leading-tight">Beta 1.0</span>
                        <span className="num text-[13px] text-dim">15 nov · en 27 días</span>
                    </div>
                </section>

                <section className="rise glass flex flex-col gap-5 p-6" aria-label="Cronograma del proyecto">
                    <div className="flex items-center gap-3">
                        <h2 className="flex flex-1 items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-ink before:h-1.5 before:w-1.5 before:bg-accent before:content-[''] after:block after:h-px after:flex-1 after:bg-gradient-to-r after:from-white/25 after:to-transparent after:content-['']">Cronograma</h2>
                        <span className="num hidden font-mono text-xs text-dim sm:inline">15 oct → 30 nov · 46 días</span>
                    </div>
                    <div className="px-10">
                        <div className="relative h-[108px]">
                            <div className="absolute left-0 right-0 top-[35px] h-[3px] rounded-full bg-white/10"></div>
                            <div className="absolute left-0 top-[35px] h-[3px] rounded-full bg-accent" style={{ width: "8.7%" }}></div>
                            <div className="ruler absolute left-0 right-0 top-[46px] h-[10px]" aria-hidden="true"></div>

                            <div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: "8.7%" }}>
                                <span className="whitespace-nowrap font-mono text-[11px] tracking-[0.1em] text-accent">HOY · 19 OCT</span>
                                <span className="h-5 w-px bg-accent"></span>
                            </div>
                            <span className="absolute top-[36.5px] box-border h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent" style={{ left: "8.7%" }} aria-hidden="true"></span>

                            <span className="absolute top-[36.5px] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" style={{ left: "4.35%" }}></span>
                            <div className="absolute top-[64px] w-24 -translate-x-1/2 text-center" style={{ left: "4.35%" }}>
                                <div className="text-xs text-[#93A39A]">Arquitectura</div>
                                <div className="num font-mono text-[11px] text-[#93A39A]">17 oct</div>
                            </div>

                            <span className="pulse absolute top-[36.5px] flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent" style={{ left: "67.39%" }}><span className="h-1.5 w-1.5 rounded-full bg-base"></span></span>
                            <div className="absolute top-[64px] w-24 -translate-x-1/2 text-center" style={{ left: "67.39%" }}>
                                <div className="text-xs font-medium text-ink">Beta 1.0</div>
                                <div className="num font-mono text-[11px] text-ink">15 nov</div>
                            </div>

                            <span className="absolute top-[36.5px] box-border h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-g700 bg-base" style={{ left: "100%" }}></span>
                            <div className="absolute top-[64px] w-24 -translate-x-1/2 text-center" style={{ left: "100%" }}>
                                <div className="text-xs text-dim">Lanzamiento</div>
                                <div className="num font-mono text-[11px] text-dim">30 nov</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.7fr_1fr]">

                    <div className="flex min-w-0 flex-col gap-4">

                        <div className="rise glass flex min-w-0 flex-col gap-4 p-6" >
                            <div className="flex items-center gap-3">
                                <h2 className="flex flex-1 items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-ink before:h-1.5 before:w-1.5 before:bg-accent before:content-[''] after:block after:h-px after:flex-1 after:bg-gradient-to-r after:from-white/25 after:to-transparent after:content-['']">Hitos</h2>
                                <a href="#" className="lnk text-sm">Ver cronograma →</a>
                            </div>
                            <ul className="flex flex-col gap-2.5">
                                <li className="flex items-center gap-3.5 rounded-[10px] bg-white/[0.05] px-4 py-3.5">
                                    <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-accent/15">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#8FD3AE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5" /></svg>
                                    </span>
                                    <span className="min-w-0 flex-1 text-[15px] text-[#93A39A] line-through">Aprobación de arquitectura</span>
                                    <span className="num font-mono text-[13px] text-dim">17 oct</span>
                                </li>
                                <li className="glass-hi relative flex items-start gap-3.5 rounded-[10px] bg-accent/[0.06] px-4 py-3.5">
                                    <span className="pulse mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-accent">
                                        <span className="h-2 w-2 rounded-full bg-base"></span>
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="text-[15px] font-semibold">Beta 1.0 de componentes</span>
                                        <span className="text-[13px] leading-snug text-dim">Botones, badges, modales e inputs listos en staging.</span>
                                    </span>
                                    <span className="num font-mono text-[13px] text-accent">15 nov</span>
                                </li>
                                <li className="flex items-center gap-3.5 rounded-[10px] bg-white/[0.05] px-4 py-3.5">
                                    <span className="box-border h-[22px] w-[22px] flex-none rounded-full border-[1.5px] border-g700"></span>
                                    <span className="min-w-0 flex-1 text-[15px] text-[#D4DDD8]">Lanzamiento final</span>
                                    <span className="num font-mono text-[13px] text-dim">30 nov</span>
                                </li>
                            </ul>
                        </div>

                        <div className="rise glass flex min-w-0 flex-col gap-4 p-6">
                            <div className="flex items-center gap-3">
                                <h2 className="flex flex-1 items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-ink before:h-1.5 before:w-1.5 before:bg-accent before:content-[''] after:block after:h-px after:flex-1 after:bg-gradient-to-r after:from-white/25 after:to-transparent after:content-['']">Siguientes tareas</h2>
                                <a href="#" className="lnk text-sm">Ver todas →</a>
                            </div>
                            <ul className="flex flex-col gap-2" id="tasks">
                                <li>
                                    <label className="flex cursor-pointer items-center gap-3.5 rounded-[10px] bg-white/[0.05] px-4 py-3">
                                        <input type="checkbox" className="peer sr-only" data-prio="alta" />
                                        <span className="cbx flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border border-dim/60 peer-checked:border-accent peer-checked:bg-accent peer-checked:[&_svg]:opacity-100">
                                            <svg className="opacity-0" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111815" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5" /></svg>
                                        </span>
                                        <span className="min-w-0 flex-1 text-[15px] peer-checked:text-[#93A39A] peer-checked:line-through">Migrar formularios al plugin de Tailwind</span>
                                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">Alta</span>
                                        <span className="num hidden font-mono text-[13px] text-dim sm:inline">22 oct</span>
                                    </label>
                                </li>
                                <li>
                                    <label className="flex cursor-pointer items-center gap-3.5 rounded-[10px] bg-white/[0.05] px-4 py-3">
                                        <input type="checkbox" className="peer sr-only" data-prio="alta" />
                                        <span className="cbx flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border border-dim/60 peer-checked:border-accent peer-checked:bg-accent peer-checked:[&_svg]:opacity-100">
                                            <svg className="opacity-0" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111815" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5" /></svg>
                                        </span>
                                        <span className="min-w-0 flex-1 text-[15px] peer-checked:text-[#93A39A] peer-checked:line-through">Documentar los tokens de color</span>
                                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">Alta</span>
                                        <span className="num hidden font-mono text-[13px] text-dim sm:inline">24 oct</span>
                                    </label>
                                </li>
                                <li>
                                    <label className="flex cursor-pointer items-center gap-3.5 rounded-[10px] bg-white/[0.05] px-4 py-3">
                                        <input type="checkbox" className="peer sr-only" data-prio="media" />
                                        <span className="cbx flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border border-dim/60 peer-checked:border-accent peer-checked:bg-accent peer-checked:[&_svg]:opacity-100">
                                            <svg className="opacity-0" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111815" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5" /></svg>
                                        </span>
                                        <span className="min-w-0 flex-1 text-[15px] peer-checked:text-[#93A39A] peer-checked:line-through">Revisar modales en las vistas Go</span>
                                        <span className="rounded-full border border-g700 bg-white/[0.06] px-2.5 py-0.5 text-xs text-ink">Media</span>
                                        <span className="num hidden font-mono text-[13px] text-dim sm:inline">28 oct</span>
                                    </label>
                                </li>
                                <li>
                                    <label className="flex cursor-pointer items-center gap-3.5 rounded-[10px] bg-white/[0.05] px-4 py-3">
                                        <input type="checkbox" className="peer sr-only" data-prio="baja" />
                                        <span className="cbx flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border border-dim/60 peer-checked:border-accent peer-checked:bg-accent peer-checked:[&_svg]:opacity-100">
                                            <svg className="opacity-0" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111815" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5" /></svg>
                                        </span>
                                        <span className="min-w-0 flex-1 text-[15px] peer-checked:text-[#93A39A] peer-checked:line-through">Limpiar la carpeta static/css</span>
                                        <span className="rounded-full px-2.5 py-0.5 text-xs text-dim">Baja</span>
                                        <span className="num hidden font-mono text-[13px] text-dim sm:inline">10 nov</span>
                                    </label>
                                </li>
                            </ul>
                        </div>

                    </div>

                    <div className="flex min-w-0 flex-col gap-4">

                        <aside className="rise glass flex min-w-0 flex-col gap-4 p-6" aria-label="Nota fijada">
                            <div className="flex items-center gap-3">
                                <h2 className="flex flex-1 items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-ink before:h-1.5 before:w-1.5 before:bg-accent before:content-[''] after:block after:h-px after:flex-1 after:bg-gradient-to-r after:from-white/25 after:to-transparent after:content-['']">Nota fijada</h2>
                                <a href="#" className="lnk text-sm">Todas →</a>
                            </div>
                            <article className="flex flex-col gap-2 rounded-[10px] bg-white/[0.05] p-4">
                                <h3 className="text-[15px] font-semibold">Decisiones de la reunión</h3>
                                <p className="text-sm leading-relaxed text-dim">Mantener el script CDN estándar para las vistas previas de desarrollo.</p>
                                <span className="num font-mono text-xs text-[#93A39A]">18 oct</span>
                            </article>
                        </aside>

                        <section className="rise glass flex min-w-0 flex-col gap-4 p-6" aria-label="Actividad reciente">
                            <h2 className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-ink before:h-1.5 before:w-1.5 before:bg-accent before:content-[''] after:block after:h-px after:flex-1 after:bg-gradient-to-r after:from-white/25 after:to-transparent after:content-['']">Actividad reciente</h2>
                            <ol className="relative flex flex-col gap-4 pl-5">
                                <span className="absolute bottom-1 left-[4px] top-1.5 w-px bg-g700" aria-hidden="true"></span>
                                <li className="relative flex flex-col gap-0.5">
                                    <span className="absolute -left-5 top-1.5 h-[9px] w-[9px] rounded-full bg-accent"></span>
                                    <span className="text-sm leading-snug">Tarea terminada: estilos de formularios heredados</span>
                                    <span className="font-mono text-xs text-dim">Hace 2 horas</span>
                                </li>
                                <li className="relative flex flex-col gap-0.5">
                                    <span className="absolute -left-5 top-1.5 h-[9px] w-[9px] rounded-full bg-g700"></span>
                                    <span className="text-sm leading-snug">Enlace agregado: guía de tokens en Figma</span>
                                    <span className="font-mono text-xs text-dim">Ayer, 4:30 p. m.</span>
                                </li>
                                <li className="relative flex flex-col gap-0.5">
                                    <span className="absolute -left-5 top-1.5 h-[9px] w-[9px] rounded-full bg-g700"></span>
                                    <span className="text-sm leading-snug">Nota nueva: CDN frente a build con CLI</span>
                                    <span className="font-mono text-xs text-dim">17 oct</span>
                                </li>
                            </ol>
                        </section>

                    </div>

                </section>
            </main>
        </>

    )
}

export default Test