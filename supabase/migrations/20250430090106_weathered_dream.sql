/*
  # Create tables for hybrid database strategy

  1. New Tables
    - `pos_transactions`: Stores point of sale transactions
      - `id` (uuid, primary key)
      - `amount` (numeric)
      - `description` (text)
      - `timestamp` (timestamptz)
      - `user_id` (uuid, references auth.users)
    
    - `payroll_entries`: Stores payroll entries
      - `id` (uuid, primary key)
      - `employee_id` (uuid)
      - `amount` (numeric)
      - `type` (text)
      - `period_start` (date)
      - `period_end` (date)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create pos_transactions table
CREATE TABLE IF NOT EXISTS pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  description text,
  timestamp timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create payroll_entries table
CREATE TABLE IF NOT EXISTS payroll_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own pos_transactions"
  ON pos_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pos_transactions"
  ON pos_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own payroll_entries"
  ON payroll_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payroll_entries"
  ON payroll_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);