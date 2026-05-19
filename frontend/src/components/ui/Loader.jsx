export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-white/30 border-t-pink-400 rounded-full animate-spin" />
      <p className="mt-3 sm:mt-4 text-white/80 text-sm sm:text-base text-center">{text}</p>
    </div>
  );
}
