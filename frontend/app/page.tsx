import Link from "next/link";

export default function Home() {
  return (
    <div className={style.landingContainer}>
      <main className={style.mainCont}>
        <div className={style.nonImageCont}>
          <h1 className={style.mainHeading.default}>
            <div className={style.mainHeading.text1}>Stop Chatting...</div>
            {/* PUT THINGS TO WORK! Slogan use if animation are in place (changing text animation) */}
          </h1>
          <p className={style.smallHeading}>Hands-free desktop automation</p>
          <div className={style.btnContainer}>
            <Link href="/auth/signup" className={style.defaultBtn}>
              Try Now!
            </Link>
          </div>
        </div>
        <div id="frontendImg" className={style.imageCont}>
          <img
            src="https://reactbits.dev/assets/pro/components/aurora-beam-poster.webp"
            alt="Nexus Dashboard Preview"
            className={style.image}
          />
        </div>
      </main>
    </div>
  );
}

const style = {
  landingContainer:
    "flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full my-auto",
  mainCont:
    "flex flex-col xl:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-12 xl:gap-20",
  nonImageCont:
    "flex flex-col items-center xl:items-start text-center xl:text-left flex-1 max-w-xl",
  mainHeading: {
    default:
      "text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#DCD3FF]",
    text1:
      "text-4xl p-2 sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-linear-to-r from-[#DCD3FF] via-[#c4b5fd] to-[#9129b6] bg-clip-text text-transparent",
    text2:
      "text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#DCD3FF]",
  },
  smallHeading:
    "mt-4 text-base sm:text-xl text-[#8A859E] font-medium tracking-wide",
  btnContainer: "flex items-center justify-center xl:justify-start mt-6 mb-2",
  defaultBtn:
    "inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-white text-base sm:text-lg font-bold bg-linear-to-r from-[#7357E2] to-[#9129b6] shadow-lg shadow-purple-950/60 hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 cursor-pointer text-nowrap",
  imageCont:
    "w-full flex-1 max-w-xl xl:max-w-2xl flex items-center justify-center overflow-hidden rounded-2xl border border-purple-900/40 bg-zinc-950/40 p-2 shadow-2xl backdrop-blur-md shadow-purple-950/30",
  image: "w-full h-auto object-contain rounded-xl shadow-2xl",
};
