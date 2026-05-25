type TugOfWarProps = {
  myPercentage: number;
  currentUserColor: string;
  opponentColor: string;
};

export const TugOfWar = ({
  myPercentage,
  currentUserColor,
  opponentColor,
}: TugOfWarProps) => {
  return (
    <div className="bg-muted/30 border-border relative flex h-3 flex-1 overflow-hidden rounded-full border shadow-inner">
      <div className="bg-background/80 absolute top-0 bottom-0 left-1/2 z-10 w-0.5 -translate-x-1/2" />
      <div
        className="h-full transition-all duration-700 ease-out"
        style={{
          width: `${myPercentage}%`,
          backgroundColor: currentUserColor,
        }}
      />
      <div
        className="h-full transition-all duration-700 ease-out"
        style={{
          width: `${100 - myPercentage}%`,
          backgroundColor: opponentColor,
        }}
      />
    </div>
  );
};
