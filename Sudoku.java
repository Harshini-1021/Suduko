import java.util.Scanner;

/**
 * Sudoku Validator & Solver (Java port)
 * Concepts: 2D Arrays, Backtracking
 * Grid: 9x9 int array, 1-9 = filled, 0 = empty
 *
 * Compile: javac Sudoku.java
 * Run:     java Sudoku
 */
public class Sudoku {

    static final int N = 9;
    static long placements = 0;
    static long backtracks = 0;

    // ---------- Engine ----------

    /** Can value v go at (r, c) without clashing in row, column or 3x3 box? */
    static boolean isSafe(int[][] g, int r, int c, int v) {
        for (int i = 0; i < N; i++) {
            if (g[r][i] == v || g[i][c] == v) return false;
        }
        int br = (r / 3) * 3, bc = (c / 3) * 3;
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (g[br + i][bc + j] == v) return false;
            }
        }
        return true;
    }

    /** Marks every filled cell whose value is repeated in its row, column or box. */
    static boolean[][] findConflicts(int[][] g) {
        boolean[][] bad = new boolean[N][N];
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                int v = g[r][c];
                if (v == 0) continue;
                g[r][c] = 0;                       // blank it, then check against the rest
                if (!isSafe(g, r, c, v)) bad[r][c] = true;
                g[r][c] = v;                       // restore
            }
        }
        return bad;
    }

    static boolean hasConflicts(boolean[][] bad) {
        for (boolean[] row : bad)
            for (boolean b : row)
                if (b) return true;
        return false;
    }

    static boolean isComplete(int[][] g) {
        for (int[] row : g)
            for (int v : row)
                if (v == 0) return false;
        return true;
    }

    /** Backtracking solver. Fills g in place; returns true if solved. */
    static boolean solve(int[][] g) {
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (g[r][c] != 0) continue;        // clue or already filled
                for (int v = 1; v <= 9; v++) {
                    if (isSafe(g, r, c, v)) {
                        g[r][c] = v;
                        placements++;
                        if (solve(g)) return true;
                        g[r][c] = 0;               // undo
                        backtracks++;
                    }
                }
                return false;                      // no digit fits -> backtrack
            }
        }
        return true;                               // no empty cell left
    }

    // ---------- Helpers ----------

    static int[][] parse(String[] rows) {
        int[][] g = new int[N][N];
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                char ch = rows[r].charAt(c);
                g[r][c] = (ch >= '1' && ch <= '9') ? ch - '0' : 0;
            }
        }
        return g;
    }

    static int[][] copy(int[][] g) {
        int[][] h = new int[N][N];
        for (int r = 0; r < N; r++) h[r] = g[r].clone();
        return h;
    }

    static void print(int[][] g, boolean[][] bad) {
        System.out.println("+-------+-------+-------+");
        for (int r = 0; r < N; r++) {
            System.out.print("| ");
            for (int c = 0; c < N; c++) {
                String s = g[r][c] == 0 ? "." : String.valueOf(g[r][c]);
                if (bad != null && bad[r][c]) s = s + "!";
                System.out.print(String.format("%-2s", s));
                if (c % 3 == 2) System.out.print("| ");
            }
            System.out.println();
            if (r % 3 == 2) System.out.println("+-------+-------+-------+");
        }
    }

    static final String[] EASY = {
        "530070000", "600195000", "098000060",
        "800060003", "400803001", "700020006",
        "060000280", "000419005", "000080079"
    };
    static final String[] HARD = {
        "000000907", "000420180", "000705026",
        "100904000", "050000040", "000507009",
        "920108000", "034059000", "507000000"
    };

    static int[][] readCustom(Scanner sc) {
        System.out.println("Enter 9 rows, 9 chars each (1-9 = clue, 0 or . = empty):");
        String[] rows = new String[N];
        for (int r = 0; r < N; r++) {
            while (true) {
                System.out.print("Row " + (r + 1) + ": ");
                String line = sc.nextLine().trim();
                if (line.matches("[0-9.]{9}")) { rows[r] = line; break; }
                System.out.println("  Exactly 9 characters (digits or '.') please.");
            }
        }
        return parse(rows);
    }

    // ---------- Actions ----------

    static void validate(int[][] g) {
        boolean[][] bad = findConflicts(g);
        print(g, bad);
        if (hasConflicts(bad)) {
            System.out.println("INVALID: cells marked with '!' conflict.");
        } else if (isComplete(g)) {
            System.out.println("VALID: complete and correct grid.");
        } else {
            System.out.println("No conflicts so far, but the grid is not complete.");
        }
    }

    static void solveAndShow(int[][] g) {
        if (hasConflicts(findConflicts(g))) {
            System.out.println("Cannot solve: the given clues conflict with each other.");
            validate(g);
            return;
        }
        int[][] work = copy(g);                    // keep the original untouched
        placements = 0;
        backtracks = 0;
        long start = System.nanoTime();
        boolean ok = solve(work);
        double ms = (System.nanoTime() - start) / 1_000_000.0;

        if (!ok) {
            System.out.println("No solution exists for this puzzle.");
            return;
        }
        print(work, null);
        System.out.printf("Solved in %.2f ms | placements: %d | backtracks: %d%n",
                ms, placements, backtracks);
    }

    // ---------- Main ----------

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[][] grid = parse(EASY);

        while (true) {
            System.out.println("\n=== Sudoku Validator & Solver ===");
            print(grid, null);
            System.out.println("1. Load easy sample");
            System.out.println("2. Load hard sample");
            System.out.println("3. Enter my own grid");
            System.out.println("4. Validate");
            System.out.println("5. Solve");
            System.out.println("6. Exit");
            System.out.print("Choice: ");

            String choice = sc.nextLine().trim();
            switch (choice) {
                case "1": grid = parse(EASY); break;
                case "2": grid = parse(HARD); break;
                case "3": grid = readCustom(sc); break;
                case "4": validate(grid); break;
                case "5": solveAndShow(grid); break;
                case "6": System.out.println("Bye!"); return;
                default:  System.out.println("Invalid choice.");
            }
        }
    }
}
