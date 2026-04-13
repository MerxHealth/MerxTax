export default function Logo({ height = 40 }: { height?: number }) {
  return (
    <img 
      src="/logo.png" 
      alt="MerxTax" 
      style={{ height: `${height}px`, width: 'auto' }} 
    />
  )
}