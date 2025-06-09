import Image from 'next/image';

export default function Logo({ size = 60 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid #fff',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        src="/apml-logo.png"
        alt="APML Logo"
        width={size}
        height={size}
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}