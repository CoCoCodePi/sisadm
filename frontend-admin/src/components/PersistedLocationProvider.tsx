import usePersistedLocation from "../hooks/usePersistedLocation";

const PersistedLocationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  usePersistedLocation();

  return <>{children}</>;
};

export default PersistedLocationProvider;
