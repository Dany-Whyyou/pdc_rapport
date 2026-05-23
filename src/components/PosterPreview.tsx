'use client';

import type { PosterData } from '@/lib/api';
import { forwardRef } from 'react';

type Props = {
  data: PosterData;
  width?: number;
};

const PosterPreview = forwardRef<HTMLDivElement, Props>(function PosterPreview(
  { data, width = 610 },
  ref
) {
  const scale = width / 610;
  const colorDark = data.color_dark || '#1a2547';
  const colorAccent = data.color_accent || '#c89a3f';
  const colorBg = data.color_bg || '#f4ede1';

  const imageSrc = data.image_data || data.image_url || '';

  return (
    <div
      ref={ref}
      style={{
        width: `${width}px`,
        backgroundColor: colorBg,
        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
        color: colorDark,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ============ HEADER : IMAGE ============ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `${380 * scale}px`,
          overflow: 'hidden',
        }}
      >
        {imageSrc && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageSrc}
            alt="header"
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {/* Gradient fade vers le fond */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, transparent 60%, ${colorBg}cc 90%, ${colorBg} 100%)`,
          }}
        />

        {/* Logo brand top-left */}
        <div
          style={{
            position: 'absolute',
            top: `${20 * scale}px`,
            left: `${20 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            gap: `${10 * scale}px`,
            color: '#fff',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_pdc.png"
            alt="logo"
            crossOrigin="anonymous"
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              borderRadius: '50%',
              objectFit: 'cover',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: `${13 * scale}px`, fontWeight: 700, letterSpacing: '0.05em' }}>
              {data.brand_name}
            </div>
            {data.brand_subtitle && (
              <div
                style={{
                  fontSize: `${9 * scale}px`,
                  letterSpacing: '0.25em',
                  opacity: 0.85,
                  marginTop: `${2 * scale}px`,
                }}
              >
                {data.brand_subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Période top-right pill */}
        {data.periode_label && (
          <div
            style={{
              position: 'absolute',
              top: `${26 * scale}px`,
              right: `${20 * scale}px`,
              border: '1px solid rgba(255,255,255,0.7)',
              padding: `${5 * scale}px ${14 * scale}px`,
              borderRadius: `${4 * scale}px`,
              color: '#fff',
              fontSize: `${10 * scale}px`,
              letterSpacing: '0.2em',
              fontWeight: 500,
            }}
          >
            {data.periode_label.toUpperCase()}
          </div>
        )}
      </div>

      {/* ============ TITRE ============ */}
      <div style={{ padding: `${4 * scale}px ${36 * scale}px ${20 * scale}px`, position: 'relative', marginTop: `${-30 * scale}px` }}>
        {data.program_number && (
          <div
            style={{
              fontSize: `${10 * scale}px`,
              letterSpacing: '0.4em',
              color: colorDark,
              opacity: 0.4,
              marginBottom: `${8 * scale}px`,
            }}
          >
            {data.program_number.toUpperCase()}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: `${10 * scale}px` }}>
          <span
            style={{
              fontSize: `${48 * scale}px`,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: colorDark,
              lineHeight: 1,
            }}
          >
            {data.title_main}
          </span>
          {data.title_italic && (
            <span
              style={{
                fontSize: `${36 * scale}px`,
                fontStyle: 'italic',
                fontWeight: 400,
                color: colorAccent,
                lineHeight: 1,
              }}
            >
              {data.title_italic}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: `${48 * scale}px`,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: colorDark,
            lineHeight: 1,
            marginTop: `${4 * scale}px`,
          }}
        >
          {data.title_secondary}
        </div>

        {/* Souligne accent */}
        <div
          style={{
            width: `${56 * scale}px`,
            height: `${3 * scale}px`,
            background: colorAccent,
            marginTop: `${16 * scale}px`,
          }}
        />
      </div>

      {/* ============ LISTE ACTIVITES ============ */}
      <div style={{ padding: `0 ${20 * scale}px ${24 * scale}px` }}>
        {data.activities.map((act, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              padding: `${10 * scale}px 0`,
              borderTop: idx === 0 ? `1px solid ${colorAccent}80` : 'none',
              borderBottom: `1px solid ${colorAccent}40`,
            }}
          >
            {/* Date column */}
            <div
              style={{
                background: colorDark,
                color: '#fff',
                padding: `${10 * scale}px ${14 * scale}px`,
                minWidth: `${110 * scale}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: `${8 * scale}px`,
                  letterSpacing: '0.2em',
                  opacity: 0.7,
                  marginBottom: `${2 * scale}px`,
                }}
              >
                {act.jour.toUpperCase()}
              </div>
              <div style={{ fontSize: `${18 * scale}px`, fontWeight: 700, lineHeight: 1 }}>
                {act.date.toUpperCase()}
              </div>
            </div>

            {/* Title + details */}
            <div
              style={{
                flex: 1,
                padding: `${10 * scale}px ${16 * scale}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: `${15 * scale}px`,
                  fontWeight: 700,
                  color: colorDark,
                  lineHeight: 1.2,
                }}
              >
                {act.titre}
              </div>
              {act.details && (
                <div
                  style={{
                    fontSize: `${11 * scale}px`,
                    color: colorDark,
                    opacity: 0.6,
                    marginTop: `${4 * scale}px`,
                    lineHeight: 1.3,
                  }}
                >
                  {act.details}
                </div>
              )}
            </div>

            {/* Horaire */}
            <div
              style={{
                padding: `${10 * scale}px ${10 * scale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                fontSize: `${13 * scale}px`,
                fontWeight: 700,
                color: colorDark,
                minWidth: `${100 * scale}px`,
                textAlign: 'right',
              }}
            >
              {act.horaire}
            </div>
          </div>
        ))}
      </div>

      {/* ============ FOOTER ============ */}
      <div
        style={{
          background: colorDark,
          color: '#fff',
          padding: `${14 * scale}px ${24 * scale}px`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: `${10 * scale}px`,
          letterSpacing: '0.25em',
        }}
      >
        <div style={{ color: colorAccent, fontWeight: 600 }}>
          {data.brand_name.toUpperCase()}
        </div>
        {data.footer_tags && (
          <div style={{ opacity: 0.85 }}>
            {data.footer_tags.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
});

export default PosterPreview;
