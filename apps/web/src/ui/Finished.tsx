import { href } from "../lib/router";

export function Finished({ right, done, onAgain }: { right: number; done: number; onAgain?: () => void }) {
  return (
    <main className="screen focus">
      {done ? (
        <div className="empty pop" style={{ marginTop: "20vh" }}>
          <b>
            {right} из {done} верно
          </b>
          Ошибки вернутся в этой же сессии и в повторениях по расписанию.
        </div>
      ) : (
        <div className="empty" style={{ marginTop: "20vh" }}>
          <b>Пока нечего повторять</b>
          Новые карточки на сегодня закончились. Загляни позже или увеличь дневной лимит во вкладке «Прогресс».
        </div>
      )}
      <div className="actionbar stack">
        {onAgain && done > 0 && (
          <button className="btn primary" onClick={onAgain}>
            Ещё сессию
          </button>
        )}
        <a className="btn" href={href("today")}>
          На главную
        </a>
      </div>
    </main>
  );
}
