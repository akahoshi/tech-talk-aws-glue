import sys

from pyspark.context import SparkContext
from pyspark.sql import DataFrame

from awsglue.context import GlueContext
from awsglue.dynamicframe import DynamicFrame
from awsglue.job import Job
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions

args = getResolvedOptions(
    sys.argv, ['JOB_NAME', 'database_name', 'table_name'])

spark_context = SparkContext()
glue_context = GlueContext(spark_context)
spark_session = glue_context.spark_session

job = Job(glue_context)
job.init(args['JOB_NAME'], args)

dynamic_frame = glue_context.create_dynamic_frame_from_catalog(
    database=args['database_name'],
    table_name=args['table_name'])

dynamic_frame.toDF().show()

job.commit()
