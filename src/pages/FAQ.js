import { useState } from "react";
import faqData from "../data/faq.json";
import styles from '../styles/faq.module.css';

function InteractiveFAQ({ tree, start }) {
  const [currentId, setCurrentId] = useState(start);
  const current = tree.find((q) => q.id === currentId);

  return (
    <div className={styles.faqInteractive}>
      {current?.text && <p>{current.text}</p>}
      {current?.options && (
        <div className={styles.faqOptions}>
          {current.options.map((opt, index) => (
            <button key={index} onClick={() => setCurrentId(opt.next)}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {current?.conclusion && (
        <div className={styles.faqConclusion}>
          <p>{current.conclusion}</p>
          <button onClick={() => setCurrentId(start)}>Restart</button>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className={styles.background}>
        <div className={styles.faqPage}>
        <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
        <p className={styles.faqDesc}>The place with many questions and many answers!</p>
        {faqData.faq.map((item) => (
            <div key={item.id} className={styles.faqItem}>
            <button
                className={styles.faqQuestion}
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
            >
                {item.question}
            </button>

            <div
                className={`${styles.faqAnswer} ${
                    openId === item.id ? styles.faqOpen : styles.faqClosed
                    }`}
            >
                {openId === item.id && (
                <>
                    {item.type === "static" && <p>{item.answer}</p>}
                    {item.type === "interactive" && (
                    <InteractiveFAQ tree={item.tree} start={item.start} />
                    )}
                </>
                )}
            </div>
            </div>
        ))}
        </div>
    </div>
  );
}
