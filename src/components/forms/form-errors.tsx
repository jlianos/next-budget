type FormErrorsProps = {
  id: string;
  errors?: readonly string[];
};

export function FormErrors({ id, errors }: FormErrorsProps) {
  if (!errors?.length) {
    return null;
  }

  return (
    <ul id={id} className="space-y-1 text-sm text-red-600">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
