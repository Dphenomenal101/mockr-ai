"use client"

interface VolumeIndicatorProps {
  volume: number // 0 to 1
}

export default function VolumeIndicator({ volume }: VolumeIndicatorProps) {
  // Calculate the number of active bars (0-10)
  const maxBars = 10
  const activeBars = Math.floor(volume * maxBars)

  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {Array.from({ length: maxBars }).map((_, index) => (
        <div
          key={index}
          className={`w-1.5 rounded-full transition-all duration-100 ${
            index < activeBars
              ? index < maxBars / 3
                ? "bg-green-400 h-2"
                : index < (maxBars * 2) / 3
                  ? "bg-green-500 h-4"
                  : "bg-green-600 h-6"
              : "bg-gray-200 h-2"
          }`}
        />
      ))}
    </div>
  )
}
