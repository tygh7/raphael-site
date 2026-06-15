export default function Home() {
  return (
    <main className="flex-1 w-full min-h-screen p-8 flex flex-col items-center justify-center relative bg-[#07070a] text-zinc-100 select-none">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-indigo-950/15 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-rose-950/15 blur-[120px] pointer-events-none -z-10" />

      <div className="flex flex-col gap-2 items-center text-center">
        <h1 className="text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-200 to-rose-400 font-display uppercase">
          Clean Slate
        </h1>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">
          Ready to construct your next masterwork
        </p>
      </div>
    </main>
  );
}
