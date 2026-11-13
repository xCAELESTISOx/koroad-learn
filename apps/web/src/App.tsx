import { useLayoutEffect } from "react";
import { useLocation } from "./lib/router";
import { BankScreen, MistakesScreen } from "./screens/Bank";
import { ExamRunScreen, ExamScreen } from "./screens/Exam";
import { LearnScreen } from "./screens/Learn";
import { ProgressScreen, SourceScreen } from "./screens/Progress";
import { StudyScreen } from "./screens/Study";
import { TodayScreen } from "./screens/Today";
import { WordListScreen, WordsScreen } from "./screens/Words";
import { Overlays } from "./ui/Overlays";
import { TabBar } from "./ui/TabBar";

export function App() {
  const { route, param } = useLocation();
  // Every screen opens at its top, not at the scroll position of the screen before it.
  useLayoutEffect(() => {
    scrollTo({ top: 0 });
  }, [route, param]);
  // Sessions take the whole screen: no tab bar, so nothing competes with the answer buttons.
  const session =
    route === "study" ? (
      <StudyScreen key={`study:${param ?? ""}`} param={param} />
    ) : route === "learn" ? (
      <LearnScreen />
    ) : route === "examrun" ? (
      <ExamRunScreen />
    ) : null;
  return (
    <>
      {session ?? (
        <div className="shell">
          {route === "words" ? (
            <WordsScreen />
          ) : route === "wordlist" ? (
            <WordListScreen />
          ) : route === "exam" ? (
            <ExamScreen />
          ) : route === "progress" ? (
            <ProgressScreen />
          ) : route === "source" ? (
            <SourceScreen />
          ) : route === "bank" ? (
            <BankScreen />
          ) : route === "mistakes" ? (
            <MistakesScreen />
          ) : (
            <TodayScreen />
          )}
          <TabBar route={route} />
        </div>
      )}
      <Overlays />
    </>
  );
}
