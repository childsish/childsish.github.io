---
layout: post
title: Performance Measures
categories: statistical-learning
comments: true
---

| Name  | Equation  | Notes  |
| ----- | --------- | ------ |
| True positive  | TP  |  |
| False positives (*Type I error*)  | FP  |  |
| True negatives  | TN  |  |
| False negatives (*Type II error*)  | FN  |  |
| Accuracy  | (TP + TN) / (TP + FP + TN + FN)  | Unsuitable for unbalanced training sets |
| Sensitivity (*True positive rate, Recall*)  | TP / (TP + FN)  |  |
| Specificity (*True negative rate*)  | TN / (TN + FP)  |  |
| Positive predictive value (*Precision*)  | TP / (TP + FP)  |  |
| Negative predictive value  | TN / (TN + FN)  |  |
| Matthew's correlation coefficient  | (TP&#215;TN - FP&#215;FN) / sqrt( (TP + FP)&#215;(TP + FN)&#215;(TN + FP)&#215;(TN + FN) )  | Suitable for unbalanced testing sets |
| Balanced error rate  | (FN/(TP + FN) + FP/(FP + TN)) / 2  | Suitable for unbalanced testing sets |
| F-measure  | 2&#215;(precision&#215;recall)/(precision + recall)  | Does not take FN into account  |
| Area under the curve  |  | Calculated from the ROC curve  |
