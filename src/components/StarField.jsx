const STAR_POSITIONS = [
  [8, 12], [14, 46], [22, 24], [30, 78], [38, 14], [46, 42], [54, 68], [62, 30],
  [70, 54], [78, 20], [86, 74], [94, 36], [12, 82], [24, 58], [36, 90], [48, 8],
]

function StarField() {
  return (
    <div className="stars" aria-hidden="true">
      {STAR_POSITIONS.map(([left, top], index) => (
        <span
          className="star"
          key={`${left}-${top}`}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${index * 0.23}s`,
          }}
        />
      ))}
    </div>
  )
}

export default StarField
