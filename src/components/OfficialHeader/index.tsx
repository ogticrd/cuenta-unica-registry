import Script from 'next/script';

export default function OfficialHeader() {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/gh/opticrd/official-header/main.js"
        defer
      />

      <div style={{ height: 27, background: 'white' }}>
        <official-header />
      </div>
    </>
  );
}
