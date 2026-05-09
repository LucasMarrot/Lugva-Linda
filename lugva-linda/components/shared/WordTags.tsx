'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Badge } from '@/components/ui';

type WordTagsProps = {
  tags: string[];
  rootRef: RefObject<HTMLDivElement | null>;
  leftRef: RefObject<HTMLDivElement | null>;
  rightRef: RefObject<HTMLDivElement | null>;
  buttonsRef: RefObject<HTMLDivElement | null>;
};

export const WordTags = ({
  tags,
  rootRef,
  leftRef,
  rightRef,
  buttonsRef,
}: WordTagsProps) => {
  const [visibleTagCount, setVisibleTagCount] = useState(tags.length);
  const [maxTagsWidth, setMaxTagsWidth] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);
  const plusMeasureRef = useRef<HTMLSpanElement>(null);
  const plusTextRef = useRef<HTMLSpanElement>(null);

  const getGapValue = useCallback((element: HTMLElement) => {
    const styles = getComputedStyle(element);
    const gapValue = parseFloat(styles.columnGap || styles.gap || '0');
    return Number.isNaN(gapValue) ? 0 : gapValue;
  }, []);

  const recompute = useCallback(() => {
    const root = rootRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const buttons = buttonsRef.current;
    const measure = measureRef.current;
    const plusMeasure = plusMeasureRef.current;
    const plusText = plusTextRef.current;

    if (
      !root ||
      !left ||
      !right ||
      !buttons ||
      !measure ||
      !plusMeasure ||
      !plusText
    ) {
      return;
    }

    if (tags.length === 0) {
      setVisibleTagCount((current) => (current === 0 ? current : 0));
      setMaxTagsWidth((current) => (current === 0 ? current : 0));
      return;
    }

    const rootWidth = root.clientWidth;
    const leftWidth = left.getBoundingClientRect().width;
    const buttonsWidth = buttons.getBoundingClientRect().width;
    const rootGap = getGapValue(root);
    const rightGap = getGapValue(right);
    const availableRightWidth = rootWidth - leftWidth - rootGap;
    const rawAvailableWidth = availableRightWidth - rightGap - buttonsWidth;
    const maxAllowedWidth = rootWidth * 0.5;
    const availableWidth = Math.max(
      Math.min(rawAvailableWidth, maxAllowedWidth),
      0,
    );

    setMaxTagsWidth((current) =>
      current === availableWidth ? current : availableWidth,
    );

    if (availableWidth <= 0) {
      setVisibleTagCount((current) => (current === 0 ? current : 0));
      return;
    }

    const tagElements = Array.from(
      measure.querySelectorAll<HTMLElement>('[data-tag-index]'),
    );

    if (tagElements.length === 0) {
      setVisibleTagCount((current) => (current === 0 ? current : 0));
      return;
    }

    const tagWidths = tagElements.map(
      (element) => element.getBoundingClientRect().width,
    );
    const tagGap = getGapValue(measure);

    const getPlusWidth = (hiddenCount: number) => {
      plusText.textContent = `+${hiddenCount}`;
      return plusMeasure.getBoundingClientRect().width;
    };

    let nextVisible = 0;

    for (let visible = tagWidths.length; visible >= 0; visible -= 1) {
      const hidden = tagWidths.length - visible;
      let totalWidth = 0;

      if (visible > 0) {
        for (let index = 0; index < visible; index += 1) {
          totalWidth += tagWidths[index];
        }

        totalWidth += tagGap * (visible - 1);
      }

      if (hidden > 0) {
        totalWidth += (visible > 0 ? tagGap : 0) + getPlusWidth(hidden);
      }

      if (totalWidth <= availableWidth) {
        nextVisible = visible;
        break;
      }
    }

    setVisibleTagCount((current) =>
      current === nextVisible ? current : nextVisible,
    );
  }, [buttonsRef, getGapValue, leftRef, rightRef, rootRef, tags]);

  useLayoutEffect(() => {
    if (tags.length === 0) return;

    let frame: number;
    let observer: ResizeObserver | null = null;

    const initObserver = () => {
      const root = rootRef.current;
      const left = leftRef.current;
      const right = rightRef.current;
      const buttons = buttonsRef.current;
      const measure = measureRef.current;

      if (!root || !left || !right || !buttons || !measure) {
        frame = requestAnimationFrame(initObserver);
        return;
      }

      observer = new ResizeObserver(() => {
        recompute();
      });

      observer.observe(root);
      observer.observe(left);
      observer.observe(right);
      observer.observe(buttons);
      observer.observe(measure);

      recompute();
    };

    initObserver();

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        recompute();
      });
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
    };
  }, [buttonsRef, leftRef, recompute, rightRef, rootRef, tags.length]);

  const clampedVisibleTagCount = Math.min(visibleTagCount, tags.length);
  const visibleTags = tags.slice(0, clampedVisibleTagCount);
  const hiddenTagCount = Math.max(tags.length - clampedVisibleTagCount, 0);
  const measureElement =
    tags.length > 0 ? (
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 flex h-0 items-center gap-2 overflow-hidden opacity-0"
      >
        {tags.map((tag, index) => (
          <Badge
            key={`measure-${tag}-${index}`}
            data-tag-index={index}
            variant={index === 0 ? 'secondaryOutline' : 'outline'}
            className="shrink-0"
          >
            {tag}
          </Badge>
        ))}
        <Badge ref={plusMeasureRef} variant="outline" className="shrink-0">
          <span ref={plusTextRef} className="truncate">
            +0
          </span>
        </Badge>
      </div>
    ) : null;

  return (
    <>
      <div
        className="flex min-w-0 items-center gap-2 overflow-hidden"
        style={
          tags.length > 0 && maxTagsWidth > 0
            ? { maxWidth: maxTagsWidth }
            : undefined
        }
      >
        {visibleTags.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant={index === 0 ? 'secondaryOutline' : 'outline'}
            className="shrink-0"
          >
            {tag}
          </Badge>
        ))}

        {hiddenTagCount > 0 && (
          <Badge variant="outline" className="shrink-0">
            +{hiddenTagCount}
          </Badge>
        )}
      </div>

      {measureElement}
    </>
  );
};
