import tw from 'twin.macro';

const Link: React.FC<{ url: string; icon?: React.ReactNode }> = ({
  url,
  icon,
  children,
  ...props
}) => {
  return (
    <a
      tw="underline inline-flex items-center gap-1"
      href={url}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      <span>{children}</span>
      {icon}
    </a>
  );
};

const Typography = {
  Heading: tw.h1`text-2xl`,
  Subheading: tw.h2`text-base`,
  Description: tw.p`text-sm`,
  Link,
};

export default Typography;
