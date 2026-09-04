from hilbertcurve.hilbertcurve import HilbertCurve
from math import floor, ceil
# See https://pypi.org/project/hilbertcurve/
# Hilbert Curve with dimension n and iteration p

"""
Parameters
"""
n=784 # Dimension of Hilbert curve, n > 0
p=1 # Iteration of Hilbert curve, p > 0
t0 = 0 # Lower bound in [0,1], t0 < t1
t1 = 1 # Upper bound in [0,1], t0 < t1
subsampling = 1 # Whether to calculate equidistant samples w.r.t. given number of samples (targetNumOfSamples); 0 - false, 1 - true;
targetNumOfSamples = 1024 # Number of samples when subsampling is enabled

"""
Derive properties and calculate points
"""
d=pow(2, p*n)
print("n = ",n,", p = ",p,", 2^(np) = ",d)

# Determine Hilbert curve
hilbert_curve = HilbertCurve(p, n)

# Determine start and end integer distance
t0Int = floor(hilbert_curve.max_h*t0)
t1Int = ceil(hilbert_curve.max_h*t1)

# Check whether to sample or not
if (subsampling == 1):
    numOfSamples = targetNumOfSamples

    # Provides increment s.t. t0Int and t1Int are also included
    dT = (t1Int - t0Int + 1)/numOfSamples
    print("dT = ",dT)
    distances = [0] * numOfSamples
    for i in range(numOfSamples):
        distances[i] = round(t0Int+i*dT)

else:
    numOfSamples = d

    # Generate partial distances from t0Int up to t1Int+1 (incremented by 1 to really include last point)
    distances = list(range(t0Int, t1Int+1))
print("t0Int: ",t0Int)
print("t1Int: ",t1Int)
print("len(distances): ",len(distances))
points = hilbert_curve.points_from_distances(distances)


"""
Write to file
"""
filename = "./n"+str(n)+"_p"+str(p)+"_a"+str(t0)+"_b"+str(t1)+"_s"+str(numOfSamples)+".json"
with open(filename, "w") as f:
    # Write info about dimension, iteration, and num of entries values
    f.write("{ \"n\" : " + str(n) + ", \n")
    f.write(" \"p\" : " + str(p) + ", \n")
    f.write(" \"numOfSamples\" : " + str(numOfSamples) + ", \n")
    f.write(" \"t0\" : " + str(t0) + ", \n")
    f.write(" \"t1\" : " + str(t1) + ", \n")
    f.write(" \"subsampled\" : " + str(subsampling) + ", \n")
    # Write coordinates
    f.write(" \"samples\" : [[")

# Every point has dimension n and we have distances many, thus for the last to last we subtract 1
lastToLastPointIndex = len(points)-1
pointCounter = 0
with open(filename, "a") as f:
    for point, dist in zip(points, distances):
        coordCounter = 1
        for entry in point:
            if (coordCounter < n) :
                f.write(str(entry/hilbert_curve.max_x)+",")
                coordCounter+=1
            else:
                f.write(str(entry/hilbert_curve.max_x))

        if (pointCounter< lastToLastPointIndex):
            f.write("],[")
        pointCounter+=1

with open(filename, "a") as f:
    f.write("]]}")