import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def check_missing_values(df):
    missing_values = df.isnull().sum()
    print("Missing values per column:")
    print(missing_values)

def check_duplicates(df):
    duplicates = df.duplicated().sum()
    print(f"Number of duplicate rows: {duplicates}")

def check_data_types(df):
    print("Data types of each column:")
    print(df.dtypes)

def describe_data(df):
    print("Statistical summary:")
    print(df.describe())

def plot_outliers(df):
    sns.boxplot(data=df)
    plt.title("Boxplot for Outlier Detection")
    plt.show()

def main():
    df = pd.read_csv('./data/raw/dataset.csv')
    check_missing_values(df)
    check_duplicates(df)
    check_data_types(df)
    describe_data(df)
    plot_outliers(df)

if __name__ == "__main__":
    main()