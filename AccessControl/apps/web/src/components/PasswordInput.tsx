import { useState, type InputHTMLAttributes } from 'react';
import { EyeIcon } from './Icons';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** Campo de senha com o "olho" para mostrar/ocultar (picOlho do legado). */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={() => setVisible((value) => !value)}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}
