import { useEffect, useRef } from 'react';

// Boxes for a short numeric code. `value` is a string; empty positions are spaces.
export default function OtpInput({ value, onChange, length = 4, invalid = false, autoFocus = false, disabled = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => (value[i] && value[i] !== ' ' ? value[i] : ''));

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  // Reset focus to the first box when the parent clears the value (e.g. after a wrong code)
  useEffect(() => {
    if (value === '' && document.activeElement && refs.current.includes(document.activeElement)) refs.current[0]?.focus();
  }, [value]);

  const emit = (arr) => onChange(arr.map((d) => d || ' ').join('').trimEnd());
  const focus = (i) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const fillFrom = (start, text) => {
    const nums = text.replace(/\D/g, '');
    if (!nums) return;
    const arr = digits.slice();
    let j = start;
    for (const ch of nums) {
      if (j >= length) break;
      arr[j++] = ch;
    }
    emit(arr);
    focus(j);
  };

  const onInput = (i, e) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      const arr = digits.slice();
      arr[i] = '';
      emit(arr);
      return;
    }
    fillFrom(i, v); // handles typing and phone "one-time-code" autofill
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      const arr = digits.slice();
      arr[i - 1] = '';
      emit(arr);
      focus(i - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    fillFrom(0, e.clipboardData.getData('text'));
  };

  return (
    <div className={`otp ${invalid ? 'invalid' : ''}`} role="group" aria-label={`${length}-digit code`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          onChange={(e) => onInput(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={i === 0 ? length : 1}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
