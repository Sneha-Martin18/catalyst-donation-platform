from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math

class RouteSolver:
    """
    Service to solve the Pickup and Delivery Problem (PDP).
    Given a starting point and a list of deliveries (pickup + dropoff),
    it returns the optimized sequence.
    """

    def create_data_model(self, start_coords, deliveries):
        """
        Prepares the data for the solver.
        deliveries is a list of dicts: {'id': id, 'pickup': (lat, lng), 'dropoff': (lat, lng)}
        """
        data = {}
        # index 0 is always the starting point
        locations = [start_coords]
        
        # Each delivery has a pickup and a dropoff
        # We store the indices to define constraints later
        pickup_dropoff_pairs = []
        
        for delivery in deliveries:
            p_idx = len(locations)
            locations.append(delivery['pickup'])
            d_idx = len(locations)
            locations.append(delivery['dropoff'])
            pickup_dropoff_pairs.append([p_idx, d_idx])
            
        data['locations'] = locations
        data['num_locations'] = len(locations)
        data['pickup_delivery_rel'] = pickup_dropoff_pairs
        data['num_vehicles'] = 1
        data['depot'] = 0
        
        # Calculate distance matrix (using Euclidean as a fallback for now)
        # In a real app, this should be a call to Google Distance Matrix API
        data['distance_matrix'] = self.compute_euclidean_distance_matrix(locations)
        
        return data

    def compute_euclidean_distance_matrix(self, locations):
        """Simplistic distance matrix calculation."""
        matrix = []
        for from_node in locations:
            row = []
            for to_node in locations:
                if from_node == to_node:
                    row.append(0)
                else:
                    # Very rough approximation of distance in meters
                    # lat1, lon1 = from_node
                    dist = math.sqrt(
                        (from_node[0] - to_node[0])**2 + 
                        (from_node[1] - to_node[1])**2
                    ) * 111000 # ~111km per degree
                    row.append(int(dist))
            matrix.append(row)
        return matrix

    def solve(self, start_coords, deliveries):
        """
        Solves the TSP/PDP and returns the ordered list of location indices.
        """
        if not deliveries:
            return []

        data = self.create_data_model(start_coords, deliveries)
        manager = pywrapcp.RoutingIndexManager(
            data['num_locations'], 
            data['num_vehicles'], 
            data['depot']
        )
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return data['distance_matrix'][from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Add Distance constraint
        dimension_name = 'Distance'
        routing.AddDistanceDimension(
            transit_callback_index,
            0,      # no slack
            300000, # vehicle maximum travel distance (meters)
            True,   # start cumul to zero
            dimension_name
        )
        distance_dimension = routing.GetDimensionOrDie(dimension_name)
        distance_dimension.SetGlobalSpanCostCoefficient(100)

        # Add Pickup and Delivery constraints
        for request in data['pickup_delivery_rel']:
            pickup_index = manager.NodeToIndex(request[0])
            delivery_index = manager.NodeToIndex(request[1])
            routing.AddPickupAndDelivery(pickup_index, delivery_index)
            routing.solver().Add(
                routing.VehicleVar(pickup_index) == routing.VehicleVar(delivery_index)
            )
            routing.solver().Add(
                distance_dimension.CumulVar(pickup_index) <= 
                distance_dimension.CumulVar(delivery_index)
            )

        # Solve
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
        )

        solution = routing.SolveWithParameters(search_parameters)

        if solution:
            return self.get_ordered_locations(manager, routing, solution, data['locations'])
        return []

    def get_ordered_locations(self, manager, routing, solution, locations):
        """Extracts the route from the solution."""
        index = routing.Start(0)
        route = []
        while not routing.IsEnd(index):
            node_idx = manager.IndexToNode(index)
            route.append({
                'index': node_idx,
                'coords': locations[node_idx]
            })
            index = solution.Value(routing.NextVar(index))
        return route

solver = RouteSolver()
