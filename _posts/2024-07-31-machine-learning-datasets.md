---
layout: post
title: Understanding Different Datasets in Machine Learning
categories: machine-learning
comments: true
---

# Understanding Different Datasets in Machine Learning

When you start off learning machine learning, you'll find there are lots of different types of datasets including training, testing, validation and hold-out dataset.
The purpose of each dataset, when you need to use them and what problems they intend to solve may not always be clear.
In this post, I'll address why there are different types of datasets and when to use each type. 

<!--## Key Concepts

Before diving into the types of datasets, it's essential to grasp some fundamental concepts: performance measures and overfitting.

### Performance Measures

Performance measures are crucial for evaluating how well a machine learning model performs.
They are calculated by making predictions for a dataset for which the outcome has already been observed.
Many problems are reduced to making a binary decision: the outcome *is* something (or the positive case), or the outcome *is not* something (the negative case).
By comparing the observed outcome with the predicted outcome you get a confusion matrix that looks a little like this:

|                     |  **Predicted Positive** |  **Predicted Negative** |
|:-------------------:|:-----------------------:|:-----------------------:|
| **Actual Positive** | True Positive (TP)      | False Negative (FN)     |
| **Actual Negative** | False Positive (FP)     | True Negative (TN)      |

- **True Positive (TP):** Correctly predicted positive cases.
- **True Negative (TN):** Correctly predicted negative cases.
- **False Positive (FP):** Incorrectly predicted positive cases.
- **False Negative (FN):** Incorrectly predicted negative cases.

From these, we can derive several measures of predictive performance such as the ones below (among others):

- **Sensitivity (Recall):** TP / (TP + FN). How many of the actual positive cases were predicted?
- **Specificity:** TN / (TN + FP). How many of the actual negative cases were predicted?
- **Precision:** TP / (TP + FP). How many of the predicted positive cases are actually positive.
- **Recall:** TP / (TP + FN). How many of the actual positive cases were predicted?

These metrics help in understanding the model's accuracy and reliability, especially in different scenarios.-->

## Overfitting

The main purpose of the different types of datasets is to prevent overfitting.
Overfitting occurs when a model learns not only the underlying patterns in the training data but also the noise, leading to poor generalisation to new data.
This means that the model will perform well on the data it was trained upon, but will perform poorly on new, unseen data.

Overfitting is an unavoidable part of training a machine learning model and can be exacerbated when multiple models have been trained and the one with the best predictive performance is chosen.
If we use the same data to both train and evaluate our models, the models can become overly specialised to the training data, making them less effective on real-world data.
To combat this, we typically split the dataset into two parts: one for training the model and the other for evaluating its predictive performance.
This way, even if the model is overfit on the training data, it is evaluated only on unseen data providing an unbiased evaluation of the model's generalisability.

Cross-validation techniques, like k-fold or leave-one-out, can help to utilise the entire dataset effectively.
They involve splitting the dataset into multiple parts, with each part taking a turn being the evaluation set while the rest are used for training.
In k-fold cross-validation, the data is split into k equally sized parts, resulting in k different models and evaluations.
The resulting evaluations provide a distribution of expected predictive performance for a final model trained on the entire dataset.
In the most extreme case of k you get leave-one-out cross validation, where the dataset is split into as many parts as there are datapoints.

When splitting a dataset, it is important that the structure of the evaluation dataset matches the structure of the training dataset as closely as possible.
This basically means, you need to take care that the proportions of the labels in the training dataset are the same as the evaluation dataset.
Stratified sampling ensures that data splitting maintains the distribution of the original dataset.

## The validation dataset

When training a machine learning model, there are a multitude of machine learning algorithms to choose from such as neural networks, decision trees, random forests, support vector machines, and logistic regression.
These algorithms often come with hyper-parameters; settings that need to be tuned for optimal performance.
To find the best hyper-parameters, different combinations can be evaluated using techniques like grid search, random search, or a combination of search strategies.
Without the proper splitting and evaluation, you run the risk of choosing a combination of hyper-parameters that optimise the trained model well for the training data, but not for unseen data.
To prevent this kind of overfitting, the data is split into the *training set* and the *validation set*.
For each combination of hyper-parameter, a model is trained using the training data and validated on the validation dataset.
A final model is then trained on the whole dataset using the best combination of hyper-parameters.

## The testing dataset

When attempting to solve a problem using machine learning, you will use several different training strategies, each resulting in a model.
A training strategy is simply the choice of model training algorithm and hyper-parameter optimisation.
In order to choose the best strategy, you need a way to compare them with each other.
Again, without the proper splitting and evaluation, you run the risk of choosing a model that is optimised well for the training data, but not for unseen data.
To prevent this kind of overfitting, the data is split into the *training set* and the *testing set*.
For each training strategy you want to evaluate, a model is trained on the training set using the training algorithm and evaluated on the testing set.
A final model is then trained bvy applying the best training strategy to the whole dataset.

## The hold-out dataset

The more training strategies are evaluated, the higher the chance that the best model will actually be overfit on the whole dataset, meaning both training and testing data.
To get the best evaluation of the model's predictive performance, a *hold-out dataset* is obtained before any training strategies are attempted.
This dataset can be derived from a single split of the whole dataset or an entirely independently gathered dataset.
Once the final model is obtained, it is evaluated using the hold-out dataset to get a final unbiased estimate of it's performance.
Care must be taken not to use the hold-out dataset to choose the best model, otherwise you run the risk of overfitting the model to the hold-out dataset.
Comparing the predictive performance of the model on the testing dataset versus the hold-out datasets provides insight into how overfit the model is.
If the performance on the testing dataset if much higher than the hold-out dataset, then the model is overfit.

# Summary

So there you have it.
The different datasets are intended to give realistic evaluations of a model's preditive performance on unseen data.
The *validation dataset* is used for choosing generalisable hyper-parameters.
The *testing dataset* is used for choosing generalisable training strategies.
The *hold-out dataset* is used to evaluate the final model.
