import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getBookAnswerKey,
  type GabaritoCor,
  type GabaritoPenseBem,
} from "./src/gabarito";

type Option = "A" | "B" | "C" | "D";
type Stage = "ENTRY" | "RUNNING" | "PROGRAM_END" | "BOOK_END";

type ProgramResult = {
  programNumber: number;
  score: number;
  totalQuestions: number;
};

const QUESTIONS_PER_PROGRAM = 30;
const REGULAR_PROGRAMS = 5;
const FINAL_PROGRAM_NUMBER = 6;
const FINAL_PROGRAM_QUESTIONS = 6;
const MAX_ATTEMPTS = 3;

const PROGRAM_KEYS = [
  "programa_1",
  "programa_2",
  "programa_3",
  "programa_4",
  "programa_5",
] as const;

const KEY_TO_OPTION: Record<string, Option> = {
  q: "A",
  w: "B",
  a: "C",
  s: "D",
};

const COLOR_TO_OPTION: Record<GabaritoCor, Option> = {
  Vermelho: "A",
  Amarelo: "B",
  Azul: "C",
  Verde: "D",
};

function getProgramKey(
  programNumber: number,
): (typeof PROGRAM_KEYS)[number] | null {
  if (programNumber >= 1 && programNumber <= REGULAR_PROGRAMS) {
    return PROGRAM_KEYS[programNumber - 1];
  }

  return null;
}

function getQuestionTotalByProgram(
  programNumber: number,
  answerKey: GabaritoPenseBem | null,
): number {
  if (programNumber === FINAL_PROGRAM_NUMBER) {
    return FINAL_PROGRAM_QUESTIONS;
  }

  const programKey = getProgramKey(programNumber);
  if (!answerKey || !programKey) {
    return QUESTIONS_PER_PROGRAM;
  }

  return answerKey[programKey].length;
}

function buildFinalProgramQuestions(
  bookCode: string,
  allQuestionNumbers: number[],
): number[] {
  const allQuestions = [...allQuestionNumbers];
  let seed = (Number(bookCode) || 1) * 7919;

  for (let i = allQuestions.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  return allQuestions.slice(0, FINAL_PROGRAM_QUESTIONS);
}

function getCorrectOption(
  questionKey: number,
  colorByQuestion: Map<number, GabaritoCor>,
): Option | null {
  const color = colorByQuestion.get(questionKey);
  if (!color) {
    return null;
  }

  return COLOR_TO_OPTION[color];
}

export default function App() {
  const [bookCodeInput, setBookCodeInput] = useState<string>("");
  const [activeBookCode, setActiveBookCode] = useState<string>("");
  const [activeAnswerKey, setActiveAnswerKey] =
    useState<GabaritoPenseBem | null>(null);
  const [entryError, setEntryError] = useState<string>("");
  const [stage, setStage] = useState<Stage>("ENTRY");

  const [programNumber, setProgramNumber] = useState<number>(1);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [programScore, setProgramScore] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [programResults, setProgramResults] = useState<ProgramResult[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [finalProgramQuestions, setFinalProgramQuestions] = useState<number[]>(
    [],
  );

  const allQuestions = useMemo(
    () =>
      activeAnswerKey
        ? PROGRAM_KEYS.flatMap((programKey) => activeAnswerKey[programKey])
        : [],
    [activeAnswerKey],
  );

  const colorByQuestion = useMemo(
    () =>
      new Map<number, GabaritoCor>(
        allQuestions.map((item) => [item.questao, item.cor]),
      ),
    [allQuestions],
  );

  const currentQuestionTotal = useMemo(
    () => getQuestionTotalByProgram(programNumber, activeAnswerKey),
    [activeAnswerKey, programNumber],
  );

  const currentQuestionKey = useMemo(() => {
    if (programNumber === FINAL_PROGRAM_NUMBER) {
      return finalProgramQuestions[questionNumber - 1] ?? questionNumber;
    }

    const programKey = getProgramKey(programNumber);
    if (!activeAnswerKey || !programKey) {
      return (programNumber - 1) * QUESTIONS_PER_PROGRAM + questionNumber;
    }

    return (
      activeAnswerKey[programKey][questionNumber - 1]?.questao ?? questionNumber
    );
  }, [activeAnswerKey, finalProgramQuestions, programNumber, questionNumber]);

  const saveProgramResultAndMove = useCallback(
    (nextProgramScore: number) => {
      const totalQuestions = getQuestionTotalByProgram(
        programNumber,
        activeAnswerKey,
      );

      setProgramResults((prev) => [
        ...prev,
        {
          programNumber,
          score: nextProgramScore,
          totalQuestions,
        },
      ]);

      if (programNumber === FINAL_PROGRAM_NUMBER) {
        setStage("BOOK_END");
        return;
      }

      setStage("PROGRAM_END");
    },
    [activeAnswerKey, programNumber],
  );

  const goToNextQuestion = useCallback(
    (nextProgramScore: number) => {
      if (questionNumber < currentQuestionTotal) {
        setQuestionNumber((prev) => prev + 1);
        setAttemptNumber(1);
        return;
      }

      saveProgramResultAndMove(nextProgramScore);
    },
    [currentQuestionTotal, questionNumber, saveProgramResultAndMove],
  );

  const handleAnswer = useCallback(
    (selected: Option) => {
      if (stage !== "RUNNING") {
        return;
      }

      const correct = getCorrectOption(currentQuestionKey, colorByQuestion);

      if (!correct) {
        setFeedback("Questao sem gabarito. Pulando para a proxima.");
        goToNextQuestion(programScore);
        return;
      }

      if (selected === correct) {
        const pointsEarned = MAX_ATTEMPTS - attemptNumber + 1;
        const nextProgramScore = programScore + pointsEarned;
        const nextTotalScore = totalScore + pointsEarned;

        setProgramScore(nextProgramScore);
        setTotalScore(nextTotalScore);
        setFeedback(`Acertou e ganhou ${pointsEarned} ponto(s).`);
        goToNextQuestion(nextProgramScore);
        return;
      }

      if (attemptNumber < MAX_ATTEMPTS) {
        const nextAttempt = attemptNumber + 1;
        setAttemptNumber(nextAttempt);
        setFeedback(
          `Resposta incorreta. Tentativa ${nextAttempt}/${MAX_ATTEMPTS}.`,
        );
        return;
      }

      setFeedback("Errou as 3 tentativas. Seguindo para a proxima pergunta.");
      goToNextQuestion(programScore);
    },
    [
      attemptNumber,
      colorByQuestion,
      currentQuestionKey,
      goToNextQuestion,
      programScore,
      stage,
      totalScore,
    ],
  );

  useEffect(() => {
    if (stage !== "RUNNING") {
      return;
    }

    const eventTarget = globalThis as {
      addEventListener?: (
        type: string,
        listener: (event: {
          key?: string;
          preventDefault?: () => void;
        }) => void,
      ) => void;
      removeEventListener?: (
        type: string,
        listener: (event: {
          key?: string;
          preventDefault?: () => void;
        }) => void,
      ) => void;
    };

    if (!eventTarget.addEventListener || !eventTarget.removeEventListener) {
      return;
    }

    const onKeyDown = (event: {
      key?: string;
      preventDefault?: () => void;
    }) => {
      const pressedKey = event.key?.toLowerCase();
      if (!pressedKey) {
        return;
      }

      const mappedOption = KEY_TO_OPTION[pressedKey];
      if (!mappedOption) {
        return;
      }

      event.preventDefault?.();
      handleAnswer(mappedOption);
    };

    eventTarget.addEventListener("keydown", onKeyDown);
    return () => {
      eventTarget.removeEventListener?.("keydown", onKeyDown);
    };
  }, [handleAnswer, stage]);

  const startBook = () => {
    const { normalizedCode, answerKey } = getBookAnswerKey(bookCodeInput);

    if (!normalizedCode) {
      return;
    }

    if (!answerKey) {
      setEntryError("Livro nao encontrado, digite novamente!");
      return;
    }

    const allQuestionNumbers = PROGRAM_KEYS.flatMap((programKey) =>
      answerKey[programKey].map((item) => item.questao),
    );

    setEntryError("");
    setActiveBookCode(normalizedCode);
    setActiveAnswerKey(answerKey);
    setStage("RUNNING");
    setProgramNumber(1);
    setQuestionNumber(1);
    setAttemptNumber(1);
    setProgramScore(0);
    setTotalScore(0);
    setProgramResults([]);
    setFeedback("");
    setFinalProgramQuestions(
      buildFinalProgramQuestions(normalizedCode, allQuestionNumbers),
    );
  };

  const startNextProgram = () => {
    const nextProgramNumber = programNumber + 1;

    setProgramNumber(nextProgramNumber);
    setQuestionNumber(1);
    setAttemptNumber(1);
    setProgramScore(0);
    setFeedback("");
    setStage("RUNNING");
  };

  const changeBookCode = () => {
    setStage("ENTRY");
    setActiveBookCode("");
    setActiveAnswerKey(null);
    setBookCodeInput("");
    setEntryError("");
    setProgramNumber(1);
    setQuestionNumber(1);
    setAttemptNumber(1);
    setProgramScore(0);
    setTotalScore(0);
    setProgramResults([]);
    setFeedback("");
    setFinalProgramQuestions([]);
  };

  const renderAnswerPanel = () => {
    if (stage !== "RUNNING") {
      return null;
    }

    return (
      <View style={styles.answerPanel}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.answerButton, styles.buttonA]}
            onPress={() => handleAnswer("A")}
            activeOpacity={0.8}
          >
            <Text style={styles.answerText}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.answerButton, styles.buttonB]}
            onPress={() => handleAnswer("B")}
            activeOpacity={0.8}
          >
            <Text style={[styles.answerText, styles.answerTextDark]}>B</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.answerButton, styles.buttonC]}
            onPress={() => handleAnswer("C")}
            activeOpacity={0.8}
          >
            <Text style={styles.answerText}>C</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.answerButton, styles.buttonD]}
            onPress={() => handleAnswer("D")}
            activeOpacity={0.8}
          >
            <Text style={styles.answerText}>D</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {stage === "ENTRY" ? (
        <View style={styles.entryCard}>
          <Text style={styles.title}>Digite o numero do livro</Text>
          <Text style={styles.subtitle}>Pressione Enter para iniciar.</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 081"
            placeholderTextColor="#8D8D8D"
            value={bookCodeInput}
            onChangeText={(value) => {
              setBookCodeInput(value.replace(/\D/g, "").slice(0, 3));
              setEntryError("");
            }}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={startBook}
            autoCorrect={false}
            maxLength={3}
          />
          {entryError ? (
            <Text style={styles.entryError}>{entryError}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.enterButton}
            onPress={startBook}
            activeOpacity={0.8}
          >
            <Text style={styles.enterButtonText}>Enter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.displayCard}>
            <Text style={styles.displayMeta}>Livro {activeBookCode}</Text>
            <Text style={styles.displayMeta}>
              Programa {String(programNumber).padStart(3, "0")}
            </Text>
            <Text style={styles.displayNumber}>
              {String(questionNumber).padStart(2, "0")}
            </Text>
            <Text style={styles.displayMeta}>
              Pergunta do livro: {String(currentQuestionKey).padStart(3, "0")}
            </Text>
            <Text style={styles.displayMeta}>
              Tentativa {attemptNumber}/{MAX_ATTEMPTS}
            </Text>
            <Text style={styles.displayMeta}>Teclas: Q=A, W=B, A=C, S=D</Text>
          </View>

          {renderAnswerPanel()}

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

          {(stage === "PROGRAM_END" || stage === "BOOK_END") && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                Resumo do programa {String(programNumber).padStart(3, "0")}
              </Text>
              <Text style={styles.summaryText}>
                Pontos neste programa: {programScore}
              </Text>
              <Text style={styles.summaryText}>
                Pontos totais no livro: {totalScore}
              </Text>

              {stage === "PROGRAM_END" ? (
                <TouchableOpacity
                  style={styles.nextProgramButton}
                  onPress={startNextProgram}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextProgramButtonText}>
                    {programNumber < REGULAR_PROGRAMS
                      ? `Iniciar programa ${String(programNumber + 1).padStart(3, "0")}`
                      : "Iniciar programa 006"}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {stage === "BOOK_END" ? (
                <View style={styles.resultsBlock}>
                  <Text style={styles.summaryTitle}>Resultado final</Text>
                  {programResults.map((result) => (
                    <Text key={result.programNumber} style={styles.summaryText}>
                      Programa {String(result.programNumber).padStart(3, "0")}:{" "}
                      {result.score} ponto(s)
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          <TouchableOpacity
            style={styles.changeBookButton}
            onPress={changeBookCode}
            activeOpacity={0.8}
          >
            <Text style={styles.changeBookButtonText}>
              Trocar codigo do livro
            </Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121417",
    padding: 20,
    justifyContent: "center",
  },
  entryCard: {
    backgroundColor: "#1E232B",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    color: "#F2F4F8",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#AAB3C0",
    fontSize: 14,
  },
  entryError: {
    color: "#FF8A80",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#101319",
    color: "#F2F4F8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#394150",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
  },
  enterButton: {
    backgroundColor: "#2A6BF2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  enterButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  displayCard: {
    backgroundColor: "#0F1217",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#2E3440",
    padding: 18,
    marginBottom: 16,
    gap: 6,
  },
  displayMeta: {
    color: "#AAB3C0",
    fontSize: 14,
    fontWeight: "600",
  },
  displayNumber: {
    color: "#F2F4F8",
    fontSize: 54,
    fontWeight: "800",
    letterSpacing: 4,
  },
  answerPanel: {
    backgroundColor: "#1E232B",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  answerButton: {
    flex: 1,
    height: 76,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonA: {
    backgroundColor: "#E53935",
  },
  buttonB: {
    backgroundColor: "#FDD835",
  },
  buttonC: {
    backgroundColor: "#1E88E5",
  },
  buttonD: {
    backgroundColor: "#43A047",
  },
  answerText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },
  answerTextDark: {
    color: "#111111",
  },
  feedback: {
    color: "#D5DEEB",
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
  },
  summaryCard: {
    marginTop: 14,
    backgroundColor: "#1E232B",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryText: {
    color: "#D5DEEB",
    fontSize: 14,
  },
  nextProgramButton: {
    marginTop: 10,
    backgroundColor: "#2A6BF2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  nextProgramButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  resultsBlock: {
    marginTop: 8,
    gap: 4,
  },
  changeBookButton: {
    marginTop: 12,
    backgroundColor: "#2A2F38",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  changeBookButtonText: {
    color: "#F2F4F8",
    fontSize: 14,
    fontWeight: "700",
  },
});
